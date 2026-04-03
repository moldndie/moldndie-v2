import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"

type WebhookPayload = {
  hmac?: string
  success?: boolean
  amount_cents?: number | string | null
  order?: string | number | { id?: string | number | null } | null
  obj?: {
    amount_cents?: number | string | null
    created_at?: string | null
    currency?: string | null
    error_occured?: boolean | null
    has_parent_transaction?: boolean | null
    id?: string | number | null
    integration_id?: string | number | null
    is_3d_secure?: boolean | null
    is_auth?: boolean | null
    is_capture?: boolean | null
    is_refunded?: boolean | null
    is_standalone_payment?: boolean | null
    is_voided?: boolean | null
    order?: string | number | { id?: string | number | null } | null
    owner?: string | null
    pending?: boolean | null
    source_data?: {
      pan?: string | null
      sub_type?: string | null
      type?: string | null
    } | null
    success?: boolean
  } | null
}

type PaymobTransactionData = NonNullable<WebhookPayload["obj"]> | WebhookPayload

function buildPaymobHmacString(data: PaymobTransactionData): string {
  const orderValue =
    typeof data.order === "object" && data.order !== null ? data.order.id : data.order

  const sourceData =
    "source_data" in data && data.source_data ? data.source_data : null

  const fields = [
    data.amount_cents,
    "created_at" in data ? data.created_at : null,
    "currency" in data ? data.currency : null,
    "error_occured" in data ? data.error_occured : null,
    "has_parent_transaction" in data ? data.has_parent_transaction : null,
    "id" in data ? data.id : null,
    "integration_id" in data ? data.integration_id : null,
    "is_3d_secure" in data ? data.is_3d_secure : null,
    "is_auth" in data ? data.is_auth : null,
    "is_capture" in data ? data.is_capture : null,
    "is_refunded" in data ? data.is_refunded : null,
    "is_standalone_payment" in data ? data.is_standalone_payment : null,
    "is_voided" in data ? data.is_voided : null,
    orderValue,
    "owner" in data ? data.owner : null,
    "pending" in data ? data.pending : null,
    sourceData?.pan,
    sourceData?.sub_type,
    sourceData?.type,
    data.success,
  ]

  return fields.map((value) => String(value ?? "")).join("")
}

function verifyPaymobHmac(rawBody: string, body: WebhookPayload, hmacHeader: string): boolean {
  const secret = process.env.PAYMOB_HMAC_SECRET
  if (!secret || !hmacHeader) return false

  const rawBodyHash = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")

  if (rawBodyHash === hmacHeader) {
    console.log("HMAC verified using raw body sha256")
    return true
  }

  const data = (body.obj ?? body) as PaymobTransactionData
  const paymobTransactionHash = crypto
    .createHmac("sha512", secret)
    .update(buildPaymobHmacString(data))
    .digest("hex")

  if (paymobTransactionHash === hmacHeader) {
    console.log("HMAC verified using Paymob transaction sha512")
    return true
  }

  return false
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
  console.log("🔥 PAYMOB WEBHOOK HIT")
  const rawBody = await req.text()
  console.log("RAW BODY:", rawBody)
  const headers = Object.fromEntries(req.headers.entries())
  console.log("HEADERS:", headers)

  let body: WebhookPayload

  try {
    body = JSON.parse(rawBody) as WebhookPayload
  } catch {
    return new Response("Invalid payload", { status: 400 })
  }

  const data = body.obj || body

  const success = data.success
  const paymobOrderId = getPaymobOrderId(data.order)
  const amountCents = Number(data.amount_cents)

  console.log("Parsed Data:", {
    success,
    paymobOrderId,
    amount_cents: amountCents,
  })

  const hmac = req.headers.get("hmac") || String(body.hmac ?? "")

  if (!verifyPaymobHmac(rawBody, body, hmac)) {
    console.log("HMAC verification failed")
    return new Response("Invalid signature", { status: 401 })
  }

  if (!paymobOrderId) {
    return new Response("Order not found", { status: 404 })
  }

  const admin = createAdminClient()
  console.log("Looking for order with paymobOrderId:", paymobOrderId)
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, user_id, status, amount_cents, total_amount")
    .eq("paymob_order_id", paymobOrderId)
    .maybeSingle()

  console.log("Order found:", order)

  if (orderError) {
    return new Response("Error", { status: 500 })
  }

  if (!order) {
    return new Response("Order not found", { status: 404 })
  }

  if (order.status === "completed") {
    return new Response("Already processed", { status: 200 })
  }

  const expectedAmountCents =
    order.amount_cents ?? Math.round(Number(order.total_amount) * 100)

  if (success !== true || !Number.isFinite(amountCents) || expectedAmountCents !== amountCents) {
    return new Response("Invalid payment", { status: 400 })
  }

  const { error: completeError } = await admin.rpc("complete_order_and_clear_cart", {
    p_order_id: order.id,
    p_user_id: order.user_id,
  })

  if (completeError) {
    return new Response("Error", { status: 500 })
  }

  return new Response("OK")
}
