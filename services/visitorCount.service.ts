"use server"

import { unstable_noStore as noStore } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"

export async function getTotalVisitorCount(): Promise<number> {
  noStore()
  try {
    const admin = createAdminClient()

    const { count, error } = await admin
      .from("visitor_analytics")
      .select("*", { count: "exact", head: true })

    if (!error && count !== null && count > 0) return count

    const { count: legacy } = await admin
      .from("page_views")
      .select("*", { count: "exact", head: true })

    return legacy ?? 0
  } catch {
    return 0
  }
}

export async function getMemberCount(): Promise<number> {
  noStore()
  try {
    const admin = createAdminClient()
    const { count, error } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
    if (error || count === null) return 0
    return count
  } catch {
    return 0
  }
}

/** Real row counts behind the homepage "By the Numbers" counters. */
export async function getContentCounts(): Promise<{ blog: number; toolings: number; courses: number; events: number }> {
  noStore()
  const admin = createAdminClient()
  const n = async (table: string, published = false) => {
    try {
      let q = admin.from(table).select("*", { count: "exact", head: true })
      if (published) q = q.eq("is_published", true)
      const { count } = await q
      return count ?? 0
    } catch {
      return 0
    }
  }
  const [blog, toolings, courses, events] = await Promise.all([
    n("blogs", true), n("molds"), n("courses", true), n("events"),
  ])
  return { blog, toolings, courses, events }
}
