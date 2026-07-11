import { Eye, Megaphone, BarChart2, TrendingUp } from "lucide-react"
import { getAdAnalytics, getTopContentViews } from "@/services/contentViews.service"
import { getAds } from "@/services/ad.service"

function StatCard({
  label, value, icon: Icon, iconBg, iconColor,
}: {
  label: string
  value: number
  icon: React.ElementType
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${iconBg}`}>
          <Icon size={18} className={iconColor} strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide leading-tight">{label}</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1 leading-none">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{children}</h2>
}

const CONTENT_LABELS: Record<string, string> = {
  blog:       "Blog",
  course:     "Academy",
  mold:       "Library",
  event:      "Events",
  calculator: "Engineering",
  supplier:   "Suppliers",
  service:    "Services",
}

export async function AnalyticsSection() {
  const [adAnalytics, topContent, ads] = await Promise.allSettled([
    getAdAnalytics(),
    getTopContentViews(undefined, 10),
    getAds(),
  ])

  const adRows   = adAnalytics.status  === "fulfilled" ? adAnalytics.value  : []
  const topItems = topContent.status   === "fulfilled" ? topContent.value   : []
  const adsList  = ads.status          === "fulfilled" ? ads.value          : []

  const adMap = Object.fromEntries(adsList.map((a) => [a.id, a.title]))

  const totalAdViews   = adRows.reduce((sum, r) => sum + r.total_views,  0)
  const uniqueAdViews  = adRows.reduce((sum, r) => sum + r.unique_views, 0)
  const adViewsToday   = adRows.reduce((sum, r) => sum + r.views_today,  0)
  const adViewsMonth   = adRows.reduce((sum, r) => sum + r.views_month,  0)

  const totalContentViews = topItems.reduce((sum, r) => sum + r.views, 0)

  return (
    <div className="space-y-8 mt-8">

      {/* ── Ads Analytics ── */}
      <div className="space-y-3">
        <SectionLabel>Ad Analytics</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Ad Views"   value={totalAdViews}   icon={Megaphone}  iconBg="bg-amber-50"  iconColor="text-amber-500" />
          <StatCard label="Unique Ad Views"  value={uniqueAdViews}  icon={Eye}        iconBg="bg-orange-50" iconColor="text-orange-500" />
          <StatCard label="Views Today"      value={adViewsToday}   icon={TrendingUp} iconBg="bg-green-50"  iconColor="text-green-600" />
          <StatCard label="Views This Month" value={adViewsMonth}   icon={BarChart2}  iconBg="bg-blue-50"   iconColor="text-blue-600" />
        </div>

        {adRows.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-700 mb-4 uppercase tracking-wide">Top Performing Ads</h3>
            <div className="divide-y divide-zinc-50">
              {adRows.slice(0, 8).map((row) => (
                <div key={row.ad_id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm text-zinc-700 line-clamp-1 flex-1">
                    {adMap[row.ad_id] ?? row.ad_id.slice(0, 8) + "…"}
                  </span>
                  <div className="flex items-center gap-4 text-xs text-zinc-400 tabular-nums shrink-0">
                    <span className="flex items-center gap-1">
                      <Eye size={11} />
                      {row.unique_views.toLocaleString()} unique
                    </span>
                    <span>{row.total_views.toLocaleString()} total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Content Views ── */}
      <div className="space-y-3">
        <SectionLabel>Content Views</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard label="Total Content Views" value={totalContentViews} icon={Eye} iconBg="bg-violet-50" iconColor="text-violet-600" />
        </div>

        {topItems.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-700 mb-4 uppercase tracking-wide">Most Viewed Content</h3>
            <div className="divide-y divide-zinc-50">
              {topItems.map((item) => (
                <div key={`${item.content_type}-${item.content_id}`} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                      {CONTENT_LABELS[item.content_type] ?? item.content_type}
                    </span>
                    <span className="text-sm text-zinc-600 font-mono truncate">{item.content_id.slice(0, 16)}…</span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-900 tabular-nums shrink-0 flex items-center gap-1">
                    <Eye size={12} className="text-zinc-400" />
                    {item.views.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
