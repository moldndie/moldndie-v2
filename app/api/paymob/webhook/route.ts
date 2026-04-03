import { createAdminClient } from "@/lib/supabase/admin"

type WebhookPayload = {
  success?: boolean
  amount_cents?: number | string | null
  order?: string | number | { id?: string | number | null } | null
  obj?: {
    success?: boolean
    amount_cents?: number | string | null
    order?: string | number | { id?: string | number | null } | null
  } | null
}

function getPaymobOrderId(
  value: string | number | { id?: string | number | null } | null | undefined
): string {
  if (!value) return ""
  if (typeof value === "object") {
    return value.id == null ? "" : String(value.id)
  }
  return String(value)
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    console.log("🔥 WEBHOOK HIT")
    console.log("RAW:", rawBody)

    const body = JSON.parse(rawBody) as WebhookPayload
    const data = body.obj || body

    const success = data.success === true
    const paymobOrderId = getPaymobOrderId(data.order)
    const amountCents = data.amount_cents

    console.log("Parsed:", {
      success,
      paymobOrderId,
      amount_cents: amountCents,
    })

    if (!paymobOrderId) {
      console.error("❌ Missing order ID")
      return new Response("Missing order ID", { status: 400 })
    }

    const admin = createAdminClient()
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, user_id, status, paymob_order_id")
      .eq("paymob_order_id", String(paymobOrderId))
      .maybeSingle()

    if (orderError) {
      console.error("🔥 WEBHOOK ERROR:", orderError)
      return new Response("Server error", { status: 500 })
    }

    console.log("Order found:", order)

    if (!order) {
      console.error("❌ Order not found for Paymob ID:", paymobOrderId)
      return new Response("Order not found", { status: 404 })
    }

    console.log("DB paymobOrderId:", order.paymob_order_id)
    console.log("Webhook paymobOrderId:", paymobOrderId)

    // Use existing lowercase enum values to stay compatible with the current app.
    if (order.status === "completed" || order.status === "failed") {
      console.log("⚠️ Already processed:", order.status)
      return new Response("Already processed", { status: 200 })
    }

    const newStatus = success ? "COMPLETED" : "FAILED"
    console.log("Updating order to:", newStatus)

    if (success) {
      const { error: completeError } = await admin.rpc("complete_order_and_clear_cart", {
        p_order_id: order.id,
        p_user_id: order.user_id,
      })

      if (completeError) {
        console.error("🔥 WEBHOOK ERROR:", completeError)
        return new Response("Server error", { status: 500 })
      }
    } else {
      const { error: updateError } = await admin
        .from("orders")
        .update({ status: "failed" })
        .eq("id", order.id)

      if (updateError) {
        console.error("🔥 WEBHOOK ERROR:", updateError)
        return new Response("Server error", { status: 500 })
      }
    }

    console.log("✅ Order updated successfully")
    return new Response("OK", { status: 200 })
  } catch (error) {
    console.error("🔥 WEBHOOK ERROR:", error)
    return new Response("Server error", { status: 500 })
  }
}
