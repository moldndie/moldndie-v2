import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      path,
      visitor_id,
      session_id,
      is_new_session,
      referrer,
      language,
      timezone,
      browser,
      os,
      device_type,
    } = body

    if (!path || typeof path !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const admin = createAdminClient()

    // Try to get user_id (optional — anonymous views are fine)
    let userId: string | null = null
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch {
      // continue without user_id
    }

    // Legacy page_views table (fire-and-forget)
    Promise.resolve(admin.from("page_views").insert({ path, user_id: userId })).catch(() => {})

    // New visitor analytics — only when visitor_id is present
    if (visitor_id && typeof visitor_id === "string") {
      // Upsert visitor_analytics via RPC (handles atomic visit_count increment)
      await admin.rpc("upsert_visitor_analytics", {
        p_visitor_id:     visitor_id,
        p_last_page:      path,
        p_browser:        browser   ?? null,
        p_os:             os        ?? null,
        p_device_type:    device_type ?? null,
        p_language:       language  ?? null,
        p_timezone:       timezone  ?? null,
        p_referrer:       referrer  ?? null,
        p_is_new_session: is_new_session === true,
      })

      // Insert page_analytics (fire-and-forget)
      Promise.resolve(admin.from("page_analytics").insert({
        visitor_id,
        page_path:  path,
        session_id: session_id ?? null,
      })).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
