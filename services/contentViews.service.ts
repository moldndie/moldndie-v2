"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function getContentViewCount(
  contentType: string,
  contentId: string,
): Promise<number> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc("get_content_view_count", {
      p_content_type: contentType,
      p_content_id:   contentId,
    })
    if (error) return 0
    return Number(data) || 0
  } catch {
    return 0
  }
}

export async function getContentViewCountsMap(
  contentType: string,
  contentIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  for (const id of contentIds) map.set(id, 0)
  if (contentIds.length === 0) return map

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("content_views")
      .select("content_id, visitor_id")
      .eq("content_type", contentType)
      .in("content_id", contentIds)
    if (error || !data) return map

    const uniqueVisitors = new Map<string, Set<string>>()
    for (const row of data) {
      const set = uniqueVisitors.get(row.content_id) ?? new Set<string>()
      set.add(row.visitor_id)
      uniqueVisitors.set(row.content_id, set)
    }
    for (const [contentId, visitors] of uniqueVisitors) {
      map.set(contentId, visitors.size)
    }
    return map
  } catch {
    return map
  }
}

export interface TopContentItem {
  content_type: string
  content_id:   string
  views:        number
}

export async function getTopContentViews(
  contentType?: string,
  limit = 10,
): Promise<TopContentItem[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc("get_top_content_views", {
      p_content_type: contentType ?? null,
      p_limit:        limit,
    })
    if (error || !Array.isArray(data)) return []
    return (data as TopContentItem[]).map((r) => ({
      content_type: r.content_type,
      content_id:   r.content_id,
      views:        Number(r.views),
    }))
  } catch {
    return []
  }
}

export interface AdAnalyticsRow {
  ad_id:       string
  total_views: number
  unique_views: number
  views_today: number
  views_month: number
}

export async function getAdAnalytics(): Promise<AdAnalyticsRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc("get_ad_analytics")
    if (error || !Array.isArray(data)) return []
    return (data as AdAnalyticsRow[]).map((r) => ({
      ad_id:        r.ad_id,
      total_views:  Number(r.total_views),
      unique_views: Number(r.unique_views),
      views_today:  Number(r.views_today),
      views_month:  Number(r.views_month),
    }))
  } catch {
    return []
  }
}
