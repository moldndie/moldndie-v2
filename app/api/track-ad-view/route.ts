import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { ad_id, visitor_id, session_id, page_path } = body

    if (!ad_id || typeof ad_id !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const admin = createAdminClient()

    if (visitor_id && typeof visitor_id === "string") {
      await admin.rpc("track_ad_view", {
        p_ad_id:      ad_id,
        p_visitor_id: visitor_id,
        p_session_id: session_id ?? null,
        p_page_path:  page_path  ?? null,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
