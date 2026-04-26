import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import ServiceRequestsClient from "./ServiceRequestsClient"

export const metadata: Metadata = { title: "Services | Admin" }

export default function ServiceRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Incoming service requests from the public services page."
      />
      <ServiceRequestsClient />
    </div>
  )
}
