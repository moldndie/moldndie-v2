import { NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { r2 } from "@/lib/r2"
import { randomUUID } from "crypto"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    // ── Auth: admin only ───────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // ── Generate signed upload URL ─────────────────────────────────────────
    const { fileName, fileType, folder } = await req.json()

    if (!fileName || !fileType || !folder) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    const fileExt = fileName.split(".").pop()
    const key = `${folder}/${randomUUID()}.${fileExt}`

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: fileType,
    })

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 60 })

    const fileUrl = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/${key}`

    return NextResponse.json({ uploadUrl, fileUrl, key })
  } catch {
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 })
  }
}
