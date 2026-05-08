import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { getCalculators, getAllCategories } from "@/services/calculator.service"
import CalculatorsPageClient from "./CalculatorsPageClient"

export const metadata: Metadata = { title: "Calculators | Admin" }

export default async function CalculatorsPage() {
  const [calculators, categories] = await Promise.all([
    getCalculators(),
    getAllCategories().catch(() => []),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calculators"
        description="Build and manage dynamic engineering calculators."
      />
      <CalculatorsPageClient
        initialCalculators={calculators}
        initialCategories={categories}
      />
    </div>
  )
}
