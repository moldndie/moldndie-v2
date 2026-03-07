import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { MoldsTable } from "@/components/tables/MoldsTable"
import { getMolds, getMoldCategories } from "@/services/mold.service"

export const metadata: Metadata = { title: "Molds | Admin" }

export default async function MoldsPage() {
  const [molds, categories] = await Promise.all([getMolds(), getMoldCategories()])

  return (
    <div className="space-y-6">
      <PageHeader title="Molds" description="Manage mold listings." />
      <MoldsTable data={molds} categories={categories} />
    </div>
  )
}
