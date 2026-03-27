import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// DELETE /api/cart/clear — remove all cart items for current user
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 })

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
