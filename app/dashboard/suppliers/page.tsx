import { Metadata } from "next"
import { Suspense } from "react"
import PageHeader from "@/components/dashboard/PageHeader"
import { SuppliersTable } from "@/components/tables/SuppliersTable"
import { SupplierCategoriesTable } from "@/modules/supplier/components/SupplierCategoriesTable"
import { SupplierTabs } from "@/modules/supplier/components/SupplierTabs"

export const metadata: Metadata = { title: "Suppliers | Admin" }

interface SuppliersPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  const { tab = "suppliers" } = await searchParams

  return (
    <div className="space-y-6">
      <PageHeader title="Suppliers" description="Manage platform suppliers and categories." />

      <Suspense>
        <SupplierTabs />
      </Suspense>

      {tab === "categories" && <SupplierCategoriesTable />}
      {(tab === "suppliers" || tab !== "categories") && <SuppliersTable />}
    </div>
  )
}
