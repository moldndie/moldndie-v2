import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/cart — fetch current user's cart items
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ items: [] })
  }

  const { data, error } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

// POST /api/cart — add item (increment quantity if exists)
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 })

  const { product_id, product_type, title, price, image } = await req.json()
  if (!product_id || !product_type || !title || price == null) {
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
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data })
  }

  const { data, error } = await supabase
    .from("cart_items")
    .insert({ user_id: user.id, product_id, product_type, quantity: 1, title, price, image })
    .select()
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
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}
