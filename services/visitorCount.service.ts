"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function getTotalVisitorCount(): Promise<number> {
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
