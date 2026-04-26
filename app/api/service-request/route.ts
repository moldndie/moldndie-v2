import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

const serviceRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(5),
  phone: z.string().optional().nullable(),
  service_type: z.string().optional().nullable(),
  _hp: z.string().optional(),
})

const submissionTimes = new Map<string, number>()
const RATE_LIMIT_MS = 60_000

export async function POST(req: Request) {
  const body = await req.json()
  const result = serviceRequestSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  // Honeypot check — bots fill the hidden field
  if (result.data._hp) {
    return NextResponse.json({ ok: true })
  }

  // IP-based rate limiting (1 request per minute)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const now = Date.now()
  const last = submissionTimes.get(ip) ?? 0
  if (now - last < RATE_LIMIT_MS) {
    return NextResponse.json({ error: "Too many requests. Please wait before submitting again." }, { status: 429 })
  }
  submissionTimes.set(ip, now)

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
