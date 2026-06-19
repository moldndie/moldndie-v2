"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export interface VisitorSummary {
  total_visitors:     number
  today_visitors:     number
  week_visitors:      number
  month_visitors:     number
  returning_visitors: number
  total_page_views:   number
}

export interface TopPage {
  page_path: string
  views:     number
}

export interface TopReferrer {
  referrer: string
  visitors: number
}

export interface DeviceBreakdown {
  device_type: string
  visitors:    number
}

export interface BrowserBreakdown {
  browser:  string
  visitors: number
}

export interface DailyVisitor {
  day:      string
  visitors: number
}

export interface AnalyticsData {
  summary:          VisitorSummary
  topPages:         TopPage[]
  referrers:        TopReferrer[]
  devices:          DeviceBreakdown[]
  browsers:         BrowserBreakdown[]
  daily:            DailyVisitor[]
  migrationPending: boolean
}

function zero(): VisitorSummary {
  return {
    total_visitors: 0, today_visitors: 0, week_visitors: 0,
    month_visitors: 0, returning_visitors: 0, total_page_views: 0,
  }
}

type RpcResult = { data: unknown; error: unknown }

function rpcData(r: PromiseSettledResult<RpcResult>): unknown[] {
  if (r.status === "rejected") return []
  if (r.value.error)           return []
  return Array.isArray(r.value.data) ? r.value.data : []
}

function rpcOk(r: PromiseSettledResult<RpcResult>): boolean {
  return r.status === "fulfilled" && !r.value.error
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const admin = createAdminClient()

  // ── Step 1: new analytics RPCs (all same return shape — safe to allSettled together)
  // Promise.resolve() converts Supabase's PromiseLike to a real Promise so
  // Promise.allSettled types stay uniform and Turbopack can resolve the module graph.
  const [summaryRes, topPagesRes, referrersRes, devicesRes, browsersRes, dailyRes] =
    await Promise.allSettled([
      Promise.resolve(admin.rpc("get_visitor_summary"))                  as Promise<RpcResult>,
      Promise.resolve(admin.rpc("get_top_pages",      { p_limit: 15 })) as Promise<RpcResult>,
      Promise.resolve(admin.rpc("get_top_referrers",  { p_limit: 10 })) as Promise<RpcResult>,
      Promise.resolve(admin.rpc("get_visitor_devices"))                  as Promise<RpcResult>,
      Promise.resolve(admin.rpc("get_visitor_browsers"))                 as Promise<RpcResult>,
      Promise.resolve(admin.rpc("get_daily_visitors", { p_days: 30 }))  as Promise<RpcResult>,
    ])

  const migrationPending = !rpcOk(summaryRes)

  // ── Step 2: legacy page_views queries (separate allSettled — different return shape)
  const [legacyCountRes, legacyPathsRes] = await Promise.allSettled([
    admin.from("page_views").select("*", { count: "exact", head: true }),
    admin.from("page_views").select("path").limit(2000),
  ])

  const legacyCount =
    legacyCountRes.status === "fulfilled" ? (legacyCountRes.value.count ?? 0) : 0

  const legacyPaths =
    legacyPathsRes.status === "fulfilled"
      ? ((legacyPathsRes.value.data ?? []) as { path: string }[])
      : []

  // ── Summary ────────────────────────────────────────────────────────────────
  let summary = zero()

  if (!migrationPending) {
    const rows = rpcData(summaryRes) as (Record<string, unknown>)[]
    const raw  = rows[0]
    if (raw) {
      summary = {
        total_visitors:     Number(raw.total_visitors)     || 0,
        today_visitors:     Number(raw.today_visitors)     || 0,
        week_visitors:      Number(raw.week_visitors)      || 0,
        month_visitors:     Number(raw.month_visitors)     || 0,
        returning_visitors: Number(raw.returning_visitors) || 0,
        total_page_views:   Number(raw.total_page_views)   || 0,
      }
    }
  }

  // Always fill total_page_views from legacy if new table is empty
  if (summary.total_page_views === 0 && legacyCount > 0) {
    summary.total_page_views = legacyCount
  }

  // ── Top pages ──────────────────────────────────────────────────────────────
  let topPages: TopPage[] = (rpcData(topPagesRes) as { page_path: string; views: unknown }[])
    .map((r) => ({ page_path: r.page_path, views: Number(r.views) }))

  if (topPages.length === 0 && legacyPaths.length > 0) {
    const counts: Record<string, number> = {}
    for (const r of legacyPaths) {
      if (r.path) counts[r.path] = (counts[r.path] ?? 0) + 1
    }
    topPages = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([page_path, views]) => ({ page_path, views }))
  }

  // ── Referrers ──────────────────────────────────────────────────────────────
  const referrers: TopReferrer[] = (rpcData(referrersRes) as { referrer: string; visitors: unknown }[])
    .map((r) => ({ referrer: r.referrer, visitors: Number(r.visitors) }))

  // ── Devices ────────────────────────────────────────────────────────────────
  const devices: DeviceBreakdown[] = (rpcData(devicesRes) as { device_type: string; visitors: unknown }[])
    .map((r) => ({ device_type: r.device_type, visitors: Number(r.visitors) }))

  // ── Browsers ───────────────────────────────────────────────────────────────
  const browsers: BrowserBreakdown[] = (rpcData(browsersRes) as { browser: string; visitors: unknown }[])
    .map((r) => ({ browser: r.browser, visitors: Number(r.visitors) }))

  // ── Daily visitors ─────────────────────────────────────────────────────────
  const daily: DailyVisitor[] = (rpcData(dailyRes) as { day: string; visitors: unknown }[])
    .map((r) => ({ day: String(r.day), visitors: Number(r.visitors) }))

  return { summary, topPages, referrers, devices, browsers, daily, migrationPending }
}
