import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── 2. Fetch order (must belong to user) ──────────────────────────────────
  const admin = createAdminClient()

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, status, total_amount, user_id")
    .eq("id", id)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  if (order.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // ── 3. Fetch order items with product titles ───────────────────────────────
  const { data: items, error: itemsError } = await admin
    .from("order_items")
    .select("id, product_id, product_type, price")
    .eq("order_id", id)

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  // ── 4. Resolve product titles in parallel ─────────────────────────────────
  const moldIds = items.filter((i) => i.product_type === "mold").map((i) => i.product_id)
  const courseIds = items.filter((i) => i.product_type === "course").map((i) => i.product_id)

  const [moldsResult, coursesResult] = await Promise.all([
    moldIds.length > 0
      ? admin.from("molds").select("id, title").in("id", moldIds)
      : Promise.resolve({ data: [], error: null }),
    courseIds.length > 0
      ? admin.from("courses").select("id, title").in("id", courseIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const titleMap = new Map<string, string>()
  for (const m of moldsResult.data ?? []) titleMap.set(m.id, m.title)
  for (const c of coursesResult.data ?? []) titleMap.set(c.id, c.title)

  const enrichedItems = items.map((i) => ({
    id: i.id,
    product_id: i.product_id,
    product_type: i.product_type as "mold" | "course",
    title: titleMap.get(i.product_id) ?? "Unknown",
    price: i.price,
  }))

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      total_amount: order.total_amount,
    },
    items: enrichedItems,
  })
}
