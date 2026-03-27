import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  // ── 1. Parse payload (Paymob sends form-data or JSON) ──────────────────────
  const contentType = req.headers.get("content-type")

  let body: Record<string, any>

  if (contentType?.includes("application/json")) {
    body = await req.json()
  } else {
    const formData = await req.formData()
    body = Object.fromEntries(formData)
  }

  console.log("PAYMOB WEBHOOK:", JSON.stringify(body))

  // ── 2. Extract data (Paymob wraps inside "obj") ────────────────────────────
  const data = body.obj || body

  const success = data.success === true || data.success === "true"
  const paymobOrderId = data.order?.id ?? data.order_id

  console.log("WEBHOOK success:", success, "paymobOrderId:", paymobOrderId)

  // ── 3. Ignore failed payments ──────────────────────────────────────────────
  if (!success) {
    console.log("WEBHOOK: payment not successful, ignoring")
    return new Response("Ignored", { status: 200 })
  }

  if (!paymobOrderId) {
    console.log("WEBHOOK: missing paymobOrderId, ignoring")
    return new Response("Ignored", { status: 200 })
  }

  // ── 4. Find order by paymob_order_id ──────────────────────────────────────
  const admin = createAdminClient()

  const { data: order, error: findError } = await admin
    .from("orders")
    .select("id, status")
    .eq("paymob_order_id", String(paymobOrderId))
    .maybeSingle()

  if (findError) {
    console.error("WEBHOOK: DB error finding order:", findError.message)
    return new Response("Error", { status: 500 })
  }

  if (!order) {
    console.log("WEBHOOK: no order found for paymob_order_id:", paymobOrderId)
    return new Response("Not found", { status: 200 })
  }

  // ── 5. Skip if already completed (idempotency) ────────────────────────────
  if (order.status === "completed") {
    console.log("WEBHOOK: order already completed:", order.id)
    return new Response("OK", { status: 200 })
  }

  // ── 6. Mark order as completed ────────────────────────────────────────────
  const { error: updateError } = await admin
    .from("orders")
    .update({ status: "completed" })
    .eq("id", order.id)

  if (updateError) {
    console.error("WEBHOOK: failed to update order:", updateError.message)
    return new Response("Error", { status: 500 })
  }

  console.log("WEBHOOK: order completed:", order.id)
  return new Response("OK", { status: 200 })
}
