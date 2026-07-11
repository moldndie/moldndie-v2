import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { content_type, content_id, visitor_id, session_id } = body

    if (
      !content_type || typeof content_type !== "string" ||
      !content_id   || typeof content_id   !== "string"
    ) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const admin = createAdminClient()

    if (visitor_id && typeof visitor_id === "string") {
      await admin.rpc("track_content_view", {
        p_visitor_id:   visitor_id,
        p_content_type: content_type,
        p_content_id:   content_id,
        p_session_id:   session_id ?? null,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
