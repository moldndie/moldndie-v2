import { Metadata } from "next"
import { Suspense } from "react"
import PageHeader from "@/components/dashboard/PageHeader"
import { MoldsTable } from "@/components/tables/MoldsTable"
import { MoldCategoriesTable } from "@/modules/mold/components/MoldCategoriesTable"
import { MoldTabs } from "@/modules/mold/components/MoldTabs"

export const metadata: Metadata = { title: "Molds | Admin" }

interface MoldsPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function MoldsPage({ searchParams }: MoldsPageProps) {
  const { tab = "molds" } = await searchParams

  return (
    <div className="space-y-6">
      <PageHeader title="Molds" description="Manage mold listings and categories." />

      <Suspense>
        <MoldTabs />
      </Suspense>

      {tab === "categories" && <MoldCategoriesTable />}
      {(tab === "molds" || tab !== "categories") && <MoldsTable />}
    </div>
  )
}
