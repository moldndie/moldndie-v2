import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import ServicesManagementClient from "./ServicesManagementClient"
import ProcessStepsManager from "./ProcessStepsManager"

export const metadata: Metadata = { title: "Service Offerings | Admin" }

export default function ServicesOfferingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Offerings"
        description="Manage the services displayed on the public Services page."
      />
      <ServicesManagementClient />

      <hr className="border-zinc-100" />

      <ProcessStepsManager />
    </div>
  )
}
