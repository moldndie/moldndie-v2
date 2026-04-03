import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY!
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID!
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID!

type CartItemInput = {
  id: string
  type: "mold" | "course"
}

function generateCartHash(
  cartItems: Array<{ id: string; type: "mold" | "course"; price: number }>
): string {
  const normalizedItems = [...cartItems].sort((a, b) =>
    `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`)
  )

  return createHash("sha256")
    .update(JSON.stringify(normalizedItems))
    .digest("hex")
}

// ── Paymob helpers ─────────────────────────────────────────────────────────

async function paymobAuth(): Promise<string> {
  const res = await fetch("https://accept.paymob.com/api/auth/tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
  })

  const authData = await res.json()

  if (!authData.token) throw new Error(`Auth token failed: ${JSON.stringify(authData)}`)
  console.log("Paymob auth success")
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
      first_name: "User",
      last_name: "Test",
      email: email || "test@test.com",
      phone_number: "01000000000",
      street: "NA",
      building: "NA",
      floor: "NA",
      apartment: "NA",
      city: "Cairo",
      country: "EG",
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
  if (!paymentData.token) throw new Error(`Payment key generation failed: ${JSON.stringify(paymentData)}`)
  return paymentData.token as string
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // ── 1. Parse & validate body ──────────────────────────────────────────
    const body = await req.json()

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
    const cartHash = generateCartHash(validatedItems)

    const { data: existingOrders, error: existingOrderError } = await admin
      .from("orders")
      .select("id, payment_url")
      .eq("user_id", user.id)
      .eq("cart_hash", cartHash)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)

    if (existingOrderError) throw new Error(existingOrderError.message)

    const existingOrder = existingOrders?.[0] ?? null

    if (existingOrder?.payment_url) {
      return NextResponse.json({
        orderId: existingOrder.id,
        paymentUrl: existingOrder.payment_url,
      })
    }

    let orderId = existingOrder?.id ?? null

    // ── 5. Create order in DB ─────────────────────────────────────────────
    if (!orderId) {
      const { data: order, error: orderError } = await admin
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          amount_cents: totalCents,
          cart_hash: cartHash,
          status: "pending",
        })
        .select("id")
        .single()

      if (orderError || !order) throw new Error(orderError?.message ?? "Order creation failed")
      orderId = order.id

      // ── 6. Insert order_items ───────────────────────────────────────────
      const { error: itemsError } = await admin.from("order_items").insert(
        validatedItems.map((i) => ({
          order_id: orderId,
          product_id: i.id,
          product_type: i.type,
          price: i.price,
        }))
      )

      if (itemsError) throw new Error(itemsError.message)
    }

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

    // ── 10. Save paymob_order_id + payment_url ───────────────────────────
    if (!PAYMOB_IFRAME_ID) throw new Error("PAYMOB_IFRAME_ID is not set")
    const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`

    await admin
      .from("orders")
      .update({
        paymob_order_id: String(paymobOrderId),
        payment_url: paymentUrl,
      })
      .eq("id", orderId)

    return NextResponse.json({ orderId, paymentUrl })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Payment processing failed"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
