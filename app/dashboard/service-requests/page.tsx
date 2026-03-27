import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import ServiceRequestsClient from "./ServiceRequestsClient"

export const metadata: Metadata = { title: "Service Requests | Admin" }

export default function ServiceRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Requests"
        description="Incoming lead requests from the services page."
      />
      <ServiceRequestsClient />
    </div>
  )
}
