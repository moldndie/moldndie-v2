import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import PortfolioManagementClient from "./PortfolioManagementClient"

export const metadata: Metadata = { title: "Portfolio | Admin" }

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio"
        description="Previous works shown on the public Services page. Only the title is required."
      />
      <PortfolioManagementClient />
    </div>
  )
}
