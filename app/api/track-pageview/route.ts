import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { path } = await req.json()
    if (!path || typeof path !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    // Try to get user_id (optional — anonymous views are fine)
    let userId: string | null = null
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch {
      // continue without user_id
    }

    const admin = createAdminClient()
    await admin.from("page_views").insert({ path, user_id: userId })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
