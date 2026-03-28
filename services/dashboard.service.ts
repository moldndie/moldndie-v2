"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export interface DashboardStats {
  counts: {
    molds: number
    courses: number
    suppliers: number
    events: number
    ads: number
    users: number
  }
  metrics: {
    freeMolds: number
    paidMolds: number
    activeAds: number
  }
  analytics: {
    totalRevenue: number
    monthlyRevenue: number
  }
  recent: {
    molds: { id: string; title: string; created_at: string }[]
    courses: { id: string; title: string; created_at: string }[]
    events: { id: string; title: string; created_at: string }[]
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const today = now.toISOString().slice(0, 10)

  // ── Fetch all completed order IDs (all-time + this month) in parallel ──────
  const [completedOrdersAll, completedOrdersMonth] = await Promise.all([
    admin
      .from("orders")
      .select("id")
      .eq("status", "completed"),
    admin
      .from("orders")
      .select("id")
      .eq("status", "completed")
      .gte("created_at", monthStart),
  ])

  const allOrderIds    = (completedOrdersAll.data ?? []).map((o) => o.id)
  const monthOrderIds  = (completedOrdersMonth.data ?? []).map((o) => o.id)

  // ── Fetch order_items for completed orders + general counts in parallel ─────
  const [
    { count: moldsCount },
    { count: coursesCount },
    { count: suppliersCount },
    { count: eventsCount },
    { count: adsCount },
    { count: usersCount },
    { count: freeMoldsCount },
    { count: paidMoldsCount },
    { count: activeAdsCount },
    { data: itemsAll },
    { data: itemsMonth },
    { data: recentMolds },
    { data: recentCourses },
    { data: recentEvents },
  ] = await Promise.all([
    supabase.from("molds").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("suppliers").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("ads").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("molds").select("*", { count: "exact", head: true }).or("price.is.null,price.eq.0"),
    supabase.from("molds").select("*", { count: "exact", head: true }).gt("price", 0),
    supabase
      .from("ads")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`),
    allOrderIds.length > 0
      ? admin.from("order_items").select("price").in("order_id", allOrderIds)
      : Promise.resolve({ data: [], error: null }),
    monthOrderIds.length > 0
      ? admin.from("order_items").select("price").in("order_id", monthOrderIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("molds").select("id, title, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("courses").select("id, title, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("events").select("id, title, created_at").order("created_at", { ascending: false }).limit(5),
  ])

  const sumPrice = (rows: { price: number }[] | null) =>
    (rows ?? []).reduce((acc, r) => acc + Number(r.price), 0)

  return {
    counts: {
      molds:     moldsCount     ?? 0,
      courses:   coursesCount   ?? 0,
      suppliers: suppliersCount ?? 0,
      events:    eventsCount    ?? 0,
      ads:       adsCount       ?? 0,
      users:     usersCount     ?? 0,
    },
    metrics: {
      freeMolds:  freeMoldsCount  ?? 0,
      paidMolds:  paidMoldsCount  ?? 0,
      activeAds:  activeAdsCount  ?? 0,
    },
    analytics: {
      totalRevenue:   sumPrice(itemsAll   as { price: number }[] | null),
      monthlyRevenue: sumPrice(itemsMonth as { price: number }[] | null),
    },
    recent: {
      molds:   (recentMolds   ?? []) as { id: string; title: string; created_at: string }[],
      courses: (recentCourses ?? []) as { id: string; title: string; created_at: string }[],
      events:  (recentEvents  ?? []) as { id: string; title: string; created_at: string }[],
    },
  }
}
