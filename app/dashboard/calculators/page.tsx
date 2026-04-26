import { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"
import PageHeader from "@/components/dashboard/PageHeader"
import { getCalculators } from "@/services/calculator.service"
import CalculatorsTable from "./_components/CalculatorsTable"

export const metadata: Metadata = { title: "Calculators | Admin" }

export default async function CalculatorsPage() {
  const calculators = await getCalculators()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calculators"
        description="Build and manage dynamic engineering calculators."
        action={
          <Link
            href="/dashboard/calculators/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            New Calculator
          </Link>
        }
      />
      <CalculatorsTable initialData={calculators} />
    </div>
  )
}
