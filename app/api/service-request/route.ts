import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

const serviceRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(5),
  phone: z.string().optional().nullable(),
  service_type: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  const body = await req.json()
  const result = serviceRequestSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { name, email, phone, service_type, message } = result.data

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
