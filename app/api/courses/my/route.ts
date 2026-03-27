import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type MyCourse = {
  id: string
  title: string
  thumbnail_url: string | null
  price: number | null
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

  // ── 2. Fetch completed orders for this user ───────────────────────────────
  const { data: orders, error: ordersError } = await admin
    .from("orders")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "completed")

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 })
  }

  // ── 3. Fetch order_items → filter by product_type = "course" ─────────────
  const orderIds = (orders ?? []).map((o) => o.id)
  let purchasedCourseIds: string[] = []

  if (orderIds.length > 0) {
    const { data: orderItems, error: itemsError } = await admin
      .from("order_items")
      .select("product_id")
      .in("order_id", orderIds)
      .eq("product_type", "course")

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // ── 4. Extract course IDs + deduplicate ──────────────────────────────────
    const seen = new Set<string>()
    for (const item of orderItems ?? []) {
      seen.add(item.product_id)
    }
    purchasedCourseIds = Array.from(seen)
  }

  // ── 5. Fetch purchased courses by ID ─────────────────────────────────────
  let purchasedCourses: MyCourse[] = []
  if (purchasedCourseIds.length > 0) {
    const { data, error } = await admin
      .from("courses")
      .select("id, title, thumbnail_url, price")
      .in("id", purchasedCourseIds)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    purchasedCourses = (data ?? []) as MyCourse[]
  }

  // ── 6. Fetch free courses (price = 0 and price IS NULL separately) ────────
  const [zeroResult, nullResult] = await Promise.all([
    admin.from("courses").select("id, title, thumbnail_url, price").eq("price", 0),
    admin.from("courses").select("id, title, thumbnail_url, price").is("price", null),
  ])

  const freeCourses: MyCourse[] = [
    ...((zeroResult.data ?? []) as MyCourse[]),
    ...((nullResult.data ?? []) as MyCourse[]),
  ]

  // ── 7. Merge purchased + free, deduplicate by ID ──────────────────────────
  const seen = new Set<string>()
  const courses: MyCourse[] = []

  for (const c of [...purchasedCourses, ...freeCourses]) {
    if (!seen.has(c.id)) {
      seen.add(c.id)
      courses.push(c)
    }
  }

  return NextResponse.json({ courses })
}
