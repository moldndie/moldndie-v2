import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY!
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID!
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID!

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
  if (!res.ok) throw new Error("Paymob auth failed")
  const { token } = await res.json()
  return token as string
}

async function paymobCreateOrder(
  authToken: string,
  amountCents: number,
  items: { name: string; amount_cents: number; quantity: number; description: string }[]
): Promise<number> {
  const res = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: "EGP",
      items,
    }),
  })
  if (!res.ok) throw new Error("Paymob order creation failed")
  const { id } = await res.json()
  return id as number
}

async function paymobPaymentKey(
  authToken: string,
  paymobOrderId: number,
  amountCents: number,
  billingData: Record<string, string>
): Promise<string> {
  const res = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: paymobOrderId,
      billing_data: billingData,
      currency: "EGP",
      integration_id: Number(PAYMOB_INTEGRATION_ID),
    }),
  })
  if (!res.ok) throw new Error("Paymob payment key generation failed")
  const { token } = await res.json()
  return token as string
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient()

  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let items: CartItemInput[]

  try {
    const body = await req.json()
    items = body.items

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    for (const item of items) {
      if (!item.id || !["mold", "course"].includes(item.type)) {
        return NextResponse.json({ error: "Invalid item" }, { status: 400 })
      }
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  try {
    const admin = createAdminClient()

    // ── 3. Validate prices from DB (never trust frontend) ─────────────────
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

    // Verify all items exist and are paid products
    const validatedItems: Array<{ id: string; type: "mold" | "course"; title: string; price: number }> = []

    for (const item of items) {
      const product = dbProducts.get(`${item.type}:${item.id}`)
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.type} ${item.id}` },
          { status: 404 }
        )
      }
      const price = product.price
      if (price === null || price <= 0) {
        return NextResponse.json(
          { error: `${product.title} is free — remove it from checkout` },
          { status: 400 }
        )
      }
      validatedItems.push({ id: item.id, type: item.type, title: product.title, price })
    }

    // ── 4. Calculate total ────────────────────────────────────────────────
    const totalAmount = validatedItems.reduce((sum, i) => sum + i.price, 0)
    const totalCents = Math.round(totalAmount * 100)

    // ── 5. Create order in DB ─────────────────────────────────────────────
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        status: "pending",
      })
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

    // ── 7. Paymob integration ─────────────────────────────────────────────
    const authToken = await paymobAuth()

    const paymobOrderId = await paymobCreateOrder(
      authToken,
      totalCents,
      validatedItems.map((i) => ({
        name: i.title,
        amount_cents: Math.round(i.price * 100),
        quantity: 1,
        description: i.type,
      }))
    )

    // Fetch user email for billing data
    const billingData = {
      apartment: "NA",
      email: user.email ?? "NA",
      floor: "NA",
      first_name: user.email?.split("@")[0] ?? "Customer",
      street: "NA",
      building: "NA",
      phone_number: "NA",
      shipping_method: "NA",
      postal_code: "NA",
      city: "NA",
      country: "NA",
      last_name: "NA",
      state: "NA",
    }

    const paymentToken = await paymobPaymentKey(authToken, paymobOrderId, totalCents, billingData)

    // ── 8. Save paymob_order_id in DB ─────────────────────────────────────
    await admin
      .from("orders")
      .update({ paymob_order_id: String(paymobOrderId) })
      .eq("id", order.id)

    // ── 9. Return payment URL ─────────────────────────────────────────────
    const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`

    return NextResponse.json({ paymentUrl })
  } catch (error) {
    console.error("[create-payment]", error)
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 })
  }
}
