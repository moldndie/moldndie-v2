"use client"

import {
  Package, BookOpen, Truck, CalendarDays, Megaphone,
  Users, TrendingUp, DollarSign,
} from "lucide-react"
import { useDashboardStats } from "@/hooks/queries/useDashboard"

// ── Color-coded stat card ──────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: number | undefined
  icon: React.ElementType
  iconBg: string
  iconColor: string
  suffix?: string
  isLoading?: boolean
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor, suffix, isLoading }: StatCardProps) {
  const display = isLoading
    ? null
    : value === undefined
      ? "—"
      : suffix
        ? `${value.toLocaleString()} ${suffix}`
        : value.toLocaleString()

  return (
    <div className="group bg-white rounded-xl border border-zinc-100 p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-default">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${iconBg}`}>
          <Icon size={18} className={iconColor} strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide leading-tight">{label}</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1 leading-none">
            {display === null
              ? <span className="inline-block h-7 w-16 bg-zinc-100 rounded animate-pulse" />
              : display}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Secondary metric chip ──────────────────────────────────────────────
function MetricChip({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-100 px-5 py-4 shadow-sm flex items-center justify-between gap-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-lg font-semibold text-zinc-900">
        {value === undefined ? "—" : value.toLocaleString()}
      </p>
    </div>
  )
}

// ── Recent list ────────────────────────────────────────────────────────
function RecentList({
  title,
  items,
  isLoading,
}: {
  title: string
  items: { id: string; title: string; created_at: string }[] | undefined
  isLoading: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-700 mb-4 uppercase tracking-wide">{title}</h2>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-zinc-100 rounded animate-pulse" />
          ))}
        </div>
      ) : !items?.length ? (
        <p className="text-sm text-zinc-400 py-2">No items yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-50">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-sm text-zinc-700 line-clamp-1 flex-1">{item.title}</span>
              <span className="text-xs text-zinc-400 shrink-0 tabular-nums">
                {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Section label ──────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{children}</h2>
  )
}

// ── Main component ─────────────────────────────────────────────────────
export default function DashboardStats() {
  const { data, isLoading } = useDashboardStats()

  return (
    <div className="space-y-8">

      {/* ── Revenue ── */}
      <div className="space-y-3">
        <SectionLabel>Revenue</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Total Revenue"
            value={data?.analytics.totalRevenue}
            icon={DollarSign}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            suffix="EGP"
            isLoading={isLoading}
          />
          <StatCard
            label="This Month"
            value={data?.analytics.monthlyRevenue}
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            suffix="EGP"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* ── Content counts ── */}
      <div className="space-y-3">
        <SectionLabel>Content</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Toolings"
            value={data?.counts.molds}
            icon={Package}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
            isLoading={isLoading}
          />
          <StatCard
            label="Academy"
            value={data?.counts.courses}
            icon={BookOpen}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            isLoading={isLoading}
          />
          <StatCard
            label="Suppliers"
            value={data?.counts.suppliers}
            icon={Truck}
            iconBg="bg-sky-50"
            iconColor="text-sky-600"
            isLoading={isLoading}
          />
          <StatCard
            label="Events"
            value={data?.counts.events}
            icon={CalendarDays}
            iconBg="bg-pink-50"
            iconColor="text-pink-500"
            isLoading={isLoading}
          />
          <StatCard
            label="Ads"
            value={data?.counts.ads}
            icon={Megaphone}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            isLoading={isLoading}
          />
          <StatCard
            label="Users"
            value={data?.counts.users}
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* ── Quick metrics ── */}
      <div className="space-y-3">
        <SectionLabel>Library Breakdown</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricChip label="Free Toolings" value={data?.metrics.freeMolds} />
          <MetricChip label="Paid Toolings" value={data?.metrics.paidMolds} />
          <MetricChip label="Active Ads" value={data?.metrics.activeAds} />
        </div>
      </div>

      {/* ── Recent activity ── */}
      <div className="space-y-3">
        <SectionLabel>Recent Activity</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RecentList title="Recent Toolings" items={data?.recent.molds} isLoading={isLoading} />
          <RecentList title="Recent Academy" items={data?.recent.courses} isLoading={isLoading} />
          <RecentList title="Recent Events" items={data?.recent.events} isLoading={isLoading} />
        </div>
      </div>

    </div>
  )
}
