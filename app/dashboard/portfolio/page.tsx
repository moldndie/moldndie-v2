import { Metadata } from "next"
import { Suspense } from "react"
import PageHeader from "@/components/dashboard/PageHeader"
import PortfolioManagementClient from "./PortfolioManagementClient"

export const metadata: Metadata = { title: "Service Examples | Admin" }

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Examples"
        description="Examples shown on each service's page. Pick the service in the form; each example has its own text editor, several images and a video. Only the title is required."
      />
      <Suspense>
        <PortfolioManagementClient />
      </Suspense>
    </div>
  )
}
