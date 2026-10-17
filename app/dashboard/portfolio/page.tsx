import { Metadata } from "next"
import { Suspense } from "react"
import PageHeader from "@/components/dashboard/PageHeader"
import PortfolioManagementClient from "./PortfolioManagementClient"

export const metadata: Metadata = { title: "Case Studies | Admin" }

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Case Studies"
        description="Projects shown on the public Case Studies pages. Optionally pick a related service; each case study has its own text editor, several images and a video. Only the title is required."
      />
      <Suspense>
        <PortfolioManagementClient />
      </Suspense>
    </div>
  )
}
