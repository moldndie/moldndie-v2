import { NextResponse } from "next/server"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { r2 } from "@/lib/r2"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = await createClient()

  // ── 1. Auth guard ──────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── 2. Parse & validate body ───────────────────────────────────────────────
  let moldId: string

  try {
    const body = await req.json()
    moldId = body.moldId

    if (!moldId || typeof moldId !== "string") {
      return NextResponse.json({ error: "Missing moldId" }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  try {
    // ── 3. Fetch profile (role) and mold in parallel ─────────────────────────
    const [profileResult, moldResult] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase.from("molds").select("id, price, file_key").eq("id", moldId).single(),
    ])

    if (profileResult.error || !profileResult.data) {
      return NextResponse.json({ error: "User profile not found" }, { status: 403 })
    }

    if (moldResult.error || !moldResult.data) {
      return NextResponse.json({ error: "Mold not found" }, { status: 404 })
    }

    const profile = profileResult.data
    const mold = moldResult.data

    if (!mold.file_key) {
      return NextResponse.json({ error: "File not available" }, { status: 404 })
    }

    const key = mold.file_key

    // ── 4. Access control ─────────────────────────────────────────────────────

    // CASE 1 — Admin: full access
    if (profile.role === "admin") {
      return generateSignedUrl(key)
    }

    // CASE 2 — Free mold: price is null or 0
    const isFree = mold.price === null || mold.price === 0
    if (isFree) {
      return generateSignedUrl(key)
    }

    // CASE 3 — Paid mold: check for a completed order containing this mold
    const { data: orderItem } = await supabase
      .from("order_items")
      .select("id, orders!inner(user_id, status)")
      .eq("product_type", "mold")
      .eq("product_id", moldId)
      .eq("orders.user_id", user.id)
      .eq("orders.status", "completed")
      .maybeSingle()

    if (orderItem) {
      return generateSignedUrl(key)
    }

    // CASE 4 — No access
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

async function generateSignedUrl(key: string): Promise<NextResponse> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  })

  const downloadUrl = await getSignedUrl(r2, command, { expiresIn: 60 })
  return NextResponse.json({ downloadUrl })
}
