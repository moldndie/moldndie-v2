import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import DashboardStats from "@/components/dashboard/DashboardStats"

export const metadata: Metadata = { title: "Dashboard | Admin" }

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="System overview"
      />
      <DashboardStats />
    </div>
  )
}
