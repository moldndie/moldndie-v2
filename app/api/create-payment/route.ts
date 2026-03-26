import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY!
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID!

type CartItemInput = {
  id: string
  type: "mold" | "course"
}

// ── Paymob helpers ─────────────────────────────────────────────────────────

async function paymobAuth(): Promise<string> {
  const res = await fetch("https://accept.paymob.com/api/auth/tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
  })
  const authData = await res.json()
  console.log("AUTH RESPONSE:", JSON.stringify(authData))
  if (!authData.token) throw new Error(`Auth token failed: ${JSON.stringify(authData)}`)
  return authData.token as string
}

async function paymobCreateOrder(
  authToken: string,
  amountCents: number
): Promise<number> {
  const body = {
    auth_token: authToken,
    delivery_needed: false,
    amount_cents: amountCents,
    currency: "EGP",
    items: [],
  }
  const res = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const orderData = await res.json()
  console.log("ORDER RESPONSE:", JSON.stringify(orderData))
  if (!orderData.id) throw new Error(`Paymob order creation failed: ${JSON.stringify(orderData)}`)
  return orderData.id as number
}

async function paymobPaymentKey(
  authToken: string,
  paymobOrderId: number,
  amountCents: number,
  email: string
): Promise<string> {
  const body = {
    auth_token: authToken,
    amount_cents: amountCents,
    expiration: 3600,
    order_id: paymobOrderId,
    billing_data: {
      first_name: "Customer",
      last_name: "User",
      email: email || "customer@example.com",
      phone_number: "01000000000",
    },
    currency: "EGP",
    integration_id: Number(PAYMOB_INTEGRATION_ID),
  }
  const res = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const paymentData = await res.json()
  console.log("PAYMENT KEY RESPONSE:", JSON.stringify(paymentData))
  if (!paymentData.token) throw new Error(`Payment key generation failed: ${JSON.stringify(paymentData)}`)
  return paymentData.token as string
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // ── 0. Log ENV (debug) ─────────────────────────────────────────────────
  console.log("API KEY:", PAYMOB_API_KEY ? `set (length ${PAYMOB_API_KEY.length})` : "MISSING")
  console.log("INTEGRATION ID:", PAYMOB_INTEGRATION_ID || "MISSING")

  try {
    // ── 1. Parse & validate body ──────────────────────────────────────────
    const body = await req.json()
    console.log("[PAYMENT] request body:", JSON.stringify(body))

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Invalid items" }, { status: 400 })
    }

    const items: CartItemInput[] = body.items

    for (const item of items) {
      if (!item.id || !["mold", "course"].includes(item.type)) {
        return NextResponse.json({ error: "Invalid item" }, { status: 400 })
      }
    }

    // ── 2. Authenticate user ──────────────────────────────────────────────
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = createAdminClient()

    // ── 3. Fetch real prices from DB ──────────────────────────────────────
    const moldIds = items.filter((i) => i.type === "mold").map((i) => i.id)
    const courseIds = items.filter((i) => i.type === "course").map((i) => i.id)

    const [moldsResult, coursesResult] = await Promise.all([
      moldIds.length > 0
        ? admin.from("molds").select("id, title, price").in("id", moldIds)
        : Promise.resolve({ data: [], error: null }),
      courseIds.length > 0
        ? admin.from("courses").select("id, title, price").in("id", courseIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (moldsResult.error) throw new Error(moldsResult.error.message)
    if (coursesResult.error) throw new Error(coursesResult.error.message)

    type DBProduct = { id: string; title: string; price: number | null }
    const dbProducts = new Map<string, DBProduct & { type: "mold" | "course" }>()

    for (const m of moldsResult.data ?? []) {
      dbProducts.set(`mold:${m.id}`, { ...m, type: "mold" })
    }
    for (const c of coursesResult.data ?? []) {
      dbProducts.set(`course:${c.id}`, { ...c, type: "course" })
    }

    const validatedItems: Array<{
      id: string
      type: "mold" | "course"
      title: string
      price: number
    }> = []

    for (const item of items) {
      const product = dbProducts.get(`${item.type}:${item.id}`)
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.type} ${item.id}` },
          { status: 404 }
        )
      }
      if (product.price === null || product.price <= 0) {
        return NextResponse.json(
          { error: `${product.title} is free and cannot be purchased` },
          { status: 400 }
        )
      }
      validatedItems.push({ id: item.id, type: item.type, title: product.title, price: product.price })
    }

    // ── 4. Calculate total ────────────────────────────────────────────────
    const totalAmount = validatedItems.reduce((sum, i) => sum + i.price, 0)
    const totalCents = Math.round(totalAmount * 100)
    console.log("[PAYMENT] total amount:", totalAmount, "cents:", totalCents)

    // ── 5. Create order in DB ─────────────────────────────────────────────
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({ user_id: user.id, total_amount: totalAmount, status: "pending" })
      .select("id")
      .single()

    if (orderError || !order) throw new Error(orderError?.message ?? "Order creation failed")

    // ── 6. Insert order_items ─────────────────────────────────────────────
    const { error: itemsError } = await admin.from("order_items").insert(
      validatedItems.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        product_type: i.type,
        price: i.price,
      }))
    )

    if (itemsError) throw new Error(itemsError.message)

    // ── 7. Paymob: auth token ─────────────────────────────────────────────
    const authToken = await paymobAuth()

    // ── 8. Paymob: create order ───────────────────────────────────────────
    const paymobOrderId = await paymobCreateOrder(authToken, totalCents)

    // ── 9. Paymob: generate payment key ───────────────────────────────────
    const paymentToken = await paymobPaymentKey(
      authToken,
      paymobOrderId,
      totalCents,
      user.email ?? "customer@example.com"
    )

    // ── 10. Save paymob_order_id ──────────────────────────────────────────
    await admin
      .from("orders")
      .update({ paymob_order_id: String(paymobOrderId) })
      .eq("id", order.id)

    // ── 11. Return payment URL ────────────────────────────────────────────
    const paymentUrl = `https://accept.paymob.com/api/acceptance/payments/pay?payment_token=${paymentToken}`
    console.log("[PAYMENT] payment URL:", paymentUrl)

    return NextResponse.json({ paymentUrl })
  } catch (error: any) {
    console.error("FULL PAYMENT ERROR:", error)

    return NextResponse.json(
      {
        error: error?.message || "Unknown error",
        details: error,
      },
      { status: 500 }
    )
  }
}
