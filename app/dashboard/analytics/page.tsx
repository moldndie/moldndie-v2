import type { Metadata } from "next"
import { Suspense } from "react"
import PageHeader from "@/components/dashboard/PageHeader"
import { getAnalyticsData } from "@/services/analytics.service"
import type { AnalyticsData } from "@/services/analytics.service"
import {
  Users, TrendingUp, Eye, RotateCcw,
  Monitor, Smartphone, Tablet, Globe,
  FileText, Calendar, BarChart3, AlertTriangle,
} from "lucide-react"

export const metadata: Metadata = { title: "Analytics | Admin" }

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, iconBg, iconColor, sub,
}: {
  label: string; value: number | string; icon: React.ElementType
  iconBg: string; iconColor: string; sub?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${iconBg}`}>
          <Icon size={18} className={iconColor} strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide leading-tight">{label}</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1 leading-none">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function Section({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{title}</h2>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────
function RankTable({
  rows, labelKey, valueKey, valueLabel,
}: {
  rows: Record<string, unknown>[]
  labelKey: string
  valueKey: string
  valueLabel: string
}) {
  if (!rows.length) {
    return <p className="text-sm text-zinc-400 py-4">No data yet.</p>
  }
  const max = Number(rows[0][valueKey]) || 1
  return (
    <div className="space-y-2.5">
      {rows.map((row, i) => {
        const label = String(row[labelKey] ?? "—")
        const val   = Number(row[valueKey])
        const pct   = Math.round((val / max) * 100)
        return (
          <div key={i} className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-700 font-medium truncate max-w-[70%]" title={label}>{label}</span>
              <span className="text-zinc-500 tabular-nums">{val.toLocaleString()} {valueLabel}</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Sparkline (30-day daily visitors) ────────────────────────────────────────
function Sparkline({ data }: { data: { day: string; visitors: number }[] }) {
  const max = Math.max(...data.map((d) => d.visitors), 1)
  const W = 600, H = 80
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - (d.visitors / max) * (H - 8)
    return `${x},${y}`
  })

  return (
    <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-4">
        Daily New Visitors — Last 30 Days
      </p>
      {max === 1 && data.every((d) => d.visitors === 0) ? (
        <p className="text-sm text-zinc-400 py-2">No visitor data yet.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none">
          <polyline
            points={pts.join(" ")}
            fill="none"
            stroke="var(--color-primary, #7C2020)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * W
            const y = H - (d.visitors / max) * (H - 8)
            return (
              <circle key={i} cx={x} cy={y} r="2.5"
                fill="var(--color-primary, #7C2020)" opacity={d.visitors > 0 ? 1 : 0.15}
              />
            )
          })}
        </svg>
      )}
      <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
        <span>{data[0]?.day ? new Date(data[0].day).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
        <span>{data[data.length - 1]?.day ? new Date(data[data.length - 1].day).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
      </div>
    </div>
  )
}

// ── Device icon helper ────────────────────────────────────────────────────────
function deviceIcon(dt: string) {
  if (dt === "mobile")  return <Smartphone size={12} className="shrink-0 text-zinc-400" />
  if (dt === "tablet")  return <Tablet     size={12} className="shrink-0 text-zinc-400" />
  return <Monitor size={12} className="shrink-0 text-zinc-400" />
}

// ── Analytics body ────────────────────────────────────────────────────────────
async function AnalyticsBody() {
  const data = await getAnalyticsData()

  const { summary, topPages, referrers, devices, browsers, daily, migrationPending } = data
  const returningPct = summary.total_visitors > 0
    ? Math.round((summary.returning_visitors / summary.total_visitors) * 100)
    : 0

  return (
    <div className="space-y-8">

      {/* ── Migration banner ── */}
      {migrationPending && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800">Visitor analytics tables not yet created.</p>
            <p className="text-amber-700 mt-0.5">
              Apply <code className="bg-amber-100 px-1 rounded text-xs">supabase/migrations/20260619_visitor_analytics.sql</code> in
              your Supabase SQL editor to enable full visitor tracking. Page view counts below come from the legacy tracking table.
            </p>
          </div>
        </div>
      )}

      {/* ── Visitor overview ── */}
      <div className="space-y-3">
        <Section title={migrationPending ? "Page Views (Legacy)" : "Visitors"} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Visitors"   value={summary.total_visitors}    icon={Users}      iconBg="bg-blue-50"    iconColor="text-blue-600" />
          <StatCard label="Today"            value={summary.today_visitors}    icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard label="This Week"        value={summary.week_visitors}     icon={Calendar}   iconBg="bg-violet-50"  iconColor="text-violet-600" />
          <StatCard label="This Month"       value={summary.month_visitors}    icon={BarChart3}  iconBg="bg-sky-50"     iconColor="text-sky-600" />
          <StatCard label="Returning"        value={summary.returning_visitors} icon={RotateCcw} iconBg="bg-amber-50"   iconColor="text-amber-600"
                    sub={`${returningPct}% of total`} />
          <StatCard label="Total Page Views" value={summary.total_page_views}  icon={Eye}        iconBg="bg-pink-50"    iconColor="text-pink-500" />
        </div>
      </div>

      {/* ── Sparkline ── */}
      <Sparkline data={daily} />

      {/* ── Top pages + referrers ── */}
      <div className="space-y-3">
        <Section title="Traffic" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={14} className="text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-700">Top Pages</p>
              {migrationPending && (
                <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full">legacy</span>
              )}
            </div>
            <RankTable rows={topPages as unknown as Record<string, unknown>[]} labelKey="page_path" valueKey="views" valueLabel="views" />
          </div>
          <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={14} className="text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-700">Top Referrers</p>
            </div>
            <RankTable rows={referrers as unknown as Record<string, unknown>[]} labelKey="referrer" valueKey="visitors" valueLabel="visitors" />
          </div>
        </div>
      </div>

      {/* ── Devices + browsers ── */}
      <div className="space-y-3">
        <Section title="Audience" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
            <p className="text-sm font-semibold text-zinc-700 mb-4">Devices</p>
            {devices.length === 0 ? (
              <p className="text-sm text-zinc-400">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {devices.map((d) => (
                  <div key={d.device_type} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-zinc-700 capitalize">
                      {deviceIcon(d.device_type)}
                      {d.device_type}
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 tabular-nums">
                      {d.visitors.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
            <p className="text-sm font-semibold text-zinc-700 mb-4">Browsers</p>
            <RankTable rows={browsers as unknown as Record<string, unknown>[]} labelKey="browser" valueKey="visitors" valueLabel="visitors" />
          </div>
        </div>
      </div>

    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Visitor traffic, page performance, and audience insights"
      />
      <Suspense fallback={
        <div className="space-y-4">
          {[1,2,3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-zinc-100 animate-pulse" />
          ))}
        </div>
      }>
        <AnalyticsBody />
      </Suspense>
    </div>
  )
}
