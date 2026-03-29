import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET /api/cart — fetch current user's cart items, enriched with product data
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ items: [] })
  }

  const { data: cartRows, error } = await supabase
    .from("cart_items")
    .select("id, product_id, product_type, quantity, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!cartRows || cartRows.length === 0) return NextResponse.json({ items: [] })

  const moldIds = cartRows.filter((r) => r.product_type === "mold").map((r) => r.product_id)
  const courseIds = cartRows.filter((r) => r.product_type === "course").map((r) => r.product_id)

  const admin = createAdminClient()

  const [moldsRes, coursesRes] = await Promise.all([
    moldIds.length > 0
      ? admin.from("molds").select("id, title, price, preview_image").in("id", moldIds)
      : Promise.resolve({ data: [] }),
    courseIds.length > 0
      ? admin.from("courses").select("id, title, price, thumbnail_url").in("id", courseIds)
      : Promise.resolve({ data: [] }),
  ])

  const moldMap = new Map((moldsRes.data ?? []).map((m) => [m.id, m]))
  const courseMap = new Map((coursesRes.data ?? []).map((c) => [c.id, c]))

  const items = cartRows.map((row) => {
    if (row.product_type === "mold") {
      const product = moldMap.get(row.product_id)
      return {
        ...row,
        user_id: user.id,
        title: product?.title ?? "Unknown Mold",
        price: product?.price ?? 0,
        image: product?.preview_image ?? null,
      }
    } else {
      const product = courseMap.get(row.product_id)
      return {
        ...row,
        user_id: user.id,
        title: product?.title ?? "Unknown Course",
        price: product?.price ?? 0,
        image: product?.thumbnail_url ?? null,
      }
    }
  })

  return NextResponse.json({ items })
}

// POST /api/cart — add item (increment quantity if exists)
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 })

  const { product_id, product_type } = await req.json()
  if (!product_id || !product_type) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 })
  }

  // Check if item already exists
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", product_id)
    .eq("product_type", product_type)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + 1 })
      .eq("id", existing.id)
      .select("id, product_id, product_type, quantity, created_at")
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data })
  }

  const { data, error } = await supabase
    .from("cart_items")
    .insert({ user_id: user.id, product_id, product_type, quantity: 1 })
    .select("id, product_id, product_type, quantity, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data }, { status: 201 })
}

// DELETE /api/cart — remove one item by product_id + product_type
export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 })

  const { product_id, product_type } = await req.json()
  if (!product_id || !product_type) {
    return NextResponse.json({ error: "Missing product_id or product_type." }, { status: 400 })
  }

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", product_id)
    .eq("product_type", product_type)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// PATCH /api/cart — update quantity
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 })

  const { product_id, product_type, quantity } = await req.json()
  if (!product_id || !product_type || quantity == null) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("user_id", user.id)
    .eq("product_id", product_id)
    .eq("product_type", product_type)
    .select("id, product_id, product_type, quantity, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}
