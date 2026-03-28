"use client"

import { Package, BookOpen, Truck, CalendarDays, Megaphone, Users, Eye, TrendingUp } from "lucide-react"
import { useDashboardStats } from "@/hooks/queries/useDashboard"

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number | undefined
  icon: React.ElementType
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <Icon className="size-4 text-gray-400" />
      </div>
      <p className="text-xl font-semibold text-gray-900">
        {value === undefined ? "—" : value.toLocaleString()}
      </p>
    </div>
  )
}

function MetricCard({ label, value, currency }: { label: string; value: number | undefined; currency?: boolean }) {
  const display = value === undefined
    ? "—"
    : currency
      ? `EGP ${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : value.toLocaleString()
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-900 mt-1">{display}</p>
    </div>
  )
}

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
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h2 className="text-base font-medium text-gray-800 mb-3">{title}</h2>
      {isLoading ? (
        <p className="text-sm text-gray-400 py-2">Loading…</p>
      ) : !items?.length ? (
        <p className="text-sm text-gray-400 py-2">No items yet.</p>
      ) : (
        <ul>
          {items.map((item, i) => (
            <li
              key={item.id}
              className={`flex items-center justify-between gap-3 py-2 ${
                i < items.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <span className="text-sm text-gray-700 line-clamp-1 flex-1">{item.title}</span>
              <span className="text-xs text-gray-400 shrink-0">
                {new Date(item.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function DashboardStats() {
  const { data, isLoading } = useDashboardStats()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Molds" value={data?.counts.molds} icon={Package} />
        <StatCard label="Total Courses" value={data?.counts.courses} icon={BookOpen} />
        <StatCard label="Total Suppliers" value={data?.counts.suppliers} icon={Truck} />
        <StatCard label="Total Events" value={data?.counts.events} icon={CalendarDays} />
        <StatCard label="Total Ads" value={data?.counts.ads} icon={Megaphone} />
        <StatCard label="Total Users" value={data?.counts.users} icon={Users} />
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Visits" value={data?.analytics.totalVisits} icon={Eye} />
        <StatCard label="Monthly Visits" value={data?.analytics.monthlyVisits} icon={Eye} />
        <StatCard label="Total Revenue" value={data?.analytics.totalRevenue} icon={TrendingUp} />
        <StatCard label="Monthly Revenue" value={data?.analytics.monthlyRevenue} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard label="Free Molds" value={data?.metrics.freeMolds} />
        <MetricCard label="Paid Molds" value={data?.metrics.paidMolds} />
        <MetricCard label="Active Ads" value={data?.metrics.activeAds} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RecentList title="Recent Molds" items={data?.recent.molds} isLoading={isLoading} />
        <RecentList title="Recent Courses" items={data?.recent.courses} isLoading={isLoading} />
        <RecentList title="Recent Events" items={data?.recent.events} isLoading={isLoading} />
      </div>
    </div>
  )
}
