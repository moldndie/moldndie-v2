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
    totalVisits: number
    monthlyVisits: number
    totalRevenue: number
    monthlyRevenue: number
  }
  recent: {
    molds: { id: string; title: string; created_at: string }[]
    courses: { id: string; title: string; created_at: string }[]
    events: { id: string; title: string; created_at: string }[]
  }
}

function count(data: unknown, error: unknown): number {
  if (error) return 0
  return (data as { count: number } | null)?.count ?? 0
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const today = now.toISOString().slice(0, 10)

  const [
    { count: moldsCount, error: e1 },
    { count: coursesCount, error: e2 },
    { count: suppliersCount, error: e3 },
    { count: eventsCount, error: e4 },
    { count: adsCount, error: e5 },
    { count: usersCount, error: e6 },
    { count: freeMoldsCount, error: e7 },
    { count: paidMoldsCount, error: e8 },
    { count: activeAdsCount, error: e9 },
    { count: totalVisitsCount },
    { count: monthlyVisitsCount },
    { data: revenueAll },
    { data: revenueMonth },
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
    supabase
      .from("molds")
      .select("*", { count: "exact", head: true })
      .or("price.is.null,price.eq.0"),
    supabase
      .from("molds")
      .select("*", { count: "exact", head: true })
      .gt("price", 0),
    supabase
      .from("ads")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`),
    admin.from("page_views").select("*", { count: "exact", head: true }),
    admin
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart),
    admin.from("revenue_events").select("amount"),
    admin.from("revenue_events").select("amount").gte("created_at", monthStart),
    supabase
      .from("molds")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("courses")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("events")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const sumAmount = (rows: { amount: number }[] | null) =>
    (rows ?? []).reduce((acc, r) => acc + Number(r.amount), 0)

  return {
    counts: {
      molds: moldsCount ?? 0,
      courses: coursesCount ?? 0,
      suppliers: suppliersCount ?? 0,
      events: eventsCount ?? 0,
      ads: adsCount ?? 0,
      users: usersCount ?? 0,
    },
    metrics: {
      freeMolds: freeMoldsCount ?? 0,
      paidMolds: paidMoldsCount ?? 0,
      activeAds: activeAdsCount ?? 0,
    },
    analytics: {
      totalVisits: totalVisitsCount ?? 0,
      monthlyVisits: monthlyVisitsCount ?? 0,
      totalRevenue: sumAmount(revenueAll as { amount: number }[] | null),
      monthlyRevenue: sumAmount(revenueMonth as { amount: number }[] | null),
    },
    recent: {
      molds: (recentMolds ?? []) as { id: string; title: string; created_at: string }[],
      courses: (recentCourses ?? []) as { id: string; title: string; created_at: string }[],
      events: (recentEvents ?? []) as { id: string; title: string; created_at: string }[],
    },
  }
}
