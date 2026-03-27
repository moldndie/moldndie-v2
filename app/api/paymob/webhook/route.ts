import { createHmac } from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"

const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET ?? ""

/**
 * Recreate the Paymob HMAC-SHA512 signature.
 *
 * Paymob concatenates these fields from the transaction object (obj)
 * in this exact order before hashing:
 * https://docs.paymob.com/docs/transaction-webhooks
 */
function buildHmacString(obj: Record<string, any>): string {
  const fields = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    obj.order?.id,
    obj.owner,
    obj.pending,
    obj.source_data?.pan,
    obj.source_data?.sub_type,
    obj.source_data?.type,
    obj.success,
  ]
  return fields.map((v) => String(v ?? "")).join("")
}

function verifyHmac(obj: Record<string, any>, receivedHmac: string): boolean {
  if (!PAYMOB_HMAC_SECRET) return false
  const message = buildHmacString(obj)
  const generated = createHmac("sha512", PAYMOB_HMAC_SECRET)
    .update(message)
    .digest("hex")
  return generated === receivedHmac
}

async function markOrderCompleted(
  admin: ReturnType<typeof createAdminClient>,
  paymobOrderId: string
): Promise<Response> {
  const { data: order, error: findError } = await admin
    .from("orders")
    .select("id, status")
    .eq("paymob_order_id", paymobOrderId)
    .maybeSingle()

  if (findError) return new Response("Error", { status: 500 })
  if (!order) return new Response("Not found", { status: 200 })
  if (order.status === "completed") return new Response("OK", { status: 200 })

  const { error: updateError } = await admin
    .from("orders")
    .update({ status: "completed" })
    .eq("id", order.id)

  if (updateError) return new Response("Error", { status: 500 })

  return new Response("OK", { status: 200 })
}

export async function POST(req: Request) {
  // ── 1. Parse payload ───────────────────────────────────────────────────────
  const body = await req.json()
  const data: Record<string, any> = body.obj

  // ── 2. HMAC validation ─────────────────────────────────────────────────────
  const receivedHmac = body.hmac

  if (!receivedHmac) {
    return new Response("Unauthorized", { status: 403 })
  }

  if (!verifyHmac(data, receivedHmac)) {
    return new Response("Unauthorized", { status: 403 })
  }

  // ── 3. Extract data ────────────────────────────────────────────────────────
  const success = data.success
  const paymobOrderId = data.order?.id

  // ── 4. Ignore failed / incomplete payments ────────────────────────────────
  if (success !== true || !paymobOrderId) {
    return new Response("Ignored", { status: 200 })
  }

  // ── 5. Find and update order ───────────────────────────────────────────────
  const admin = createAdminClient()
  return markOrderCompleted(admin, String(paymobOrderId))
}

export async function GET(req: Request) {
  // ── 1. Extract params from redirect URL ───────────────────────────────────
  const url = new URL(req.url)
  const success = url.searchParams.get("success")
  const orderId = url.searchParams.get("order")

  // ── 2. Ignore failed / missing data ───────────────────────────────────────
  if (success !== "true" || !orderId) {
    return new Response("Ignored", { status: 200 })
  }

  // ── 3. Find and update order ───────────────────────────────────────────────
  const admin = createAdminClient()
  return markOrderCompleted(admin, orderId)
}
