import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ purchased: false })
  }

  const admin = createAdminClient()

  // Find completed orders for this user
  const { data: orders } = await admin
    .from("orders")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "completed")

  if (!orders || orders.length === 0) {
    return NextResponse.json({ purchased: false })
  }

  const orderIds = orders.map((o) => o.id)

  // Check if any order_item references this course
  const { data: item } = await admin
    .from("order_items")
    .select("id")
    .in("order_id", orderIds)
    .eq("product_id", id)
    .eq("product_type", "course")
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ purchased: !!item })
}
