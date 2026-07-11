import { Suspense } from "react"
import { Metadata } from "next"
import dynamic from "next/dynamic"
import PageHeader from "@/components/dashboard/PageHeader"
import { AnalyticsSection } from "@/components/dashboard/AnalyticsSection"

const DashboardStats = dynamic(() => import("@/components/dashboard/DashboardStats"), {
  loading: () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-28 rounded-xl bg-zinc-100 animate-pulse" />
      ))}
    </div>
  ),
})

export const metadata: Metadata = { title: "Dashboard | Admin" }

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="System overview" />
      <Suspense>
        <DashboardStats />
      </Suspense>
      <Suspense fallback={
        <div className="space-y-4 mt-8">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-zinc-100 animate-pulse" />
          ))}
        </div>
      }>
        <AnalyticsSection />
      </Suspense>
    </div>
  )
}
