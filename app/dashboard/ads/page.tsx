import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { AdsTable } from "@/components/tables/AdsTable"

export const metadata: Metadata = { title: "Ads | Admin" }

export default function AdsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Ads" description="Manage platform advertisements." />
      <AdsTable />
    </div>
  )
}
