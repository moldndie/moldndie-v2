import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

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

  // ── 3. Find order by paymob_order_id ──────────────────────────────────────
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

  // ── 4. Skip if already completed ──────────────────────────────────────────
  if (order.status === "completed") {
    return NextResponse.json({ ok: true, alreadyCompleted: true })
  }

  // ── 5. Mark as completed ──────────────────────────────────────────────────
  const { error: updateError } = await admin
    .from("orders")
    .update({ status: "completed" })
    .eq("id", order.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
