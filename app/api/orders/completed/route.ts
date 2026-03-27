import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type PurchasedItem = {
  id: string
  product_id: string
  product_type: "mold" | "course"
  title: string
  image: string | null
  price: number
  order_id: string
  purchased_at: string
}

export async function GET() {
  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()

  // ── 2. Fetch completed orders for this user ────────────────────────────────
  const { data: orders, error: ordersError } = await admin
    .from("orders")
    .select("id, created_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 })
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ items: [] })
  }

  const orderIds = orders.map((o) => o.id)
  const purchasedAtMap = new Map(orders.map((o) => [o.id, o.created_at]))

  // ── 3. Fetch all order_items for those orders ──────────────────────────────
  const { data: orderItems, error: itemsError } = await admin
    .from("order_items")
    .select("id, order_id, product_id, product_type, price")
    .in("order_id", orderIds)

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  if (!orderItems || orderItems.length === 0) {
    return NextResponse.json({ items: [] })
  }

  // ── 4. Resolve titles + images in parallel ─────────────────────────────────
  const moldIds = orderItems.filter((i) => i.product_type === "mold").map((i) => i.product_id)
  const courseIds = orderItems.filter((i) => i.product_type === "course").map((i) => i.product_id)

  const [moldsResult, coursesResult] = await Promise.all([
    moldIds.length > 0
      ? admin.from("molds").select("id, title, preview_image").in("id", moldIds)
      : Promise.resolve({ data: [], error: null }),
    courseIds.length > 0
      ? admin.from("courses").select("id, title, thumbnail").in("id", courseIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const metaMap = new Map<string, { title: string; image: string | null }>()
  for (const m of moldsResult.data ?? []) {
    metaMap.set(m.id, { title: m.title, image: m.preview_image ?? null })
  }
  for (const c of coursesResult.data ?? []) {
    metaMap.set(c.id, { title: c.title, image: c.thumbnail ?? null })
  }

  // ── 5. Build response ──────────────────────────────────────────────────────
  const items: PurchasedItem[] = orderItems.map((i) => {
    const meta = metaMap.get(i.product_id)
    return {
      id: i.id,
      product_id: i.product_id,
      product_type: i.product_type as "mold" | "course",
      title: meta?.title ?? "Unknown",
      image: meta?.image ?? null,
      price: i.price,
      order_id: i.order_id,
      purchased_at: purchasedAtMap.get(i.order_id) ?? "",
    }
  })

  return NextResponse.json({ items })
}
