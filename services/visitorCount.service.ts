"use server"

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Lightweight standalone function imported by the homepage.
 * Kept separate from analytics.service.ts to avoid pulling the heavy
 * Promise.allSettled / mixed-type RPC chain into the root page bundle.
 */
export async function getTotalVisitorCount(): Promise<number> {
  try {
    const admin = createAdminClient()

    const { count, error } = await admin
      .from("visitor_analytics")
      .select("*", { count: "exact", head: true })

    if (!error && count !== null && count > 0) return count

    // Fallback to legacy page_views when new table not yet created
    const { count: legacy } = await admin
      .from("page_views")
      .select("*", { count: "exact", head: true })

    return legacy ?? 0
  } catch {
    return 0
  }
}
