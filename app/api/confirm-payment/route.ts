import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// POST /api/confirm-payment — read-only status check (does NOT mark orders complete)
// Order completion is only done by the HMAC-verified Paymob webhook POST.
export async function POST(req: Request) {
  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  const body = await req.json()
  const paymobOrderId = body.paymob_order_id

  if (!paymobOrderId) {
    return NextResponse.json({ error: "Missing paymob_order_id" }, { status: 400 })
  }

  const admin = createAdminClient()

  // ── 3. Find order — verify it belongs to this user ────────────────────────
  const { data: order, error: findError } = await admin
    .from("orders")
    .select("id, status, user_id")
    .eq("paymob_order_id", String(paymobOrderId))
    .maybeSingle()

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 })
  }

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  if (order.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // ── 4. Return current status only — do NOT modify ─────────────────────────
  return NextResponse.json({ ok: true, status: order.status })
}
