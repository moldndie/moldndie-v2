import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  const body = await req.json()
  const { name, email, phone, service_type, message } = body

  if (!name || !email || !message) {
    return NextResponse.json({ error: "name, email, and message are required" }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin.from("service_requests").insert({
    name,
    email,
    phone: phone || null,
    service_type: service_type || null,
    message,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
