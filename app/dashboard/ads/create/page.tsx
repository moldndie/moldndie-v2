import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { AdForm } from "@/modules/ad/components/AdForm"

export const metadata: Metadata = { title: "Create Ad | Admin" }

export default function CreateAdPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Create Ad" description="Add a new advertisement." />
      <AdForm />
    </div>
  )
}
