import { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import PageHeader from "@/components/dashboard/PageHeader"
import { getCalculators, getCategories } from "@/services/calculator.service"
import CalculatorBuilder from "../_components/CalculatorBuilder"

export const metadata: Metadata = { title: "New Engineering Tool | Admin" }

export default async function NewCalculatorPage() {
  const [categories, calculators] = await Promise.all([
    getCategories(),
    getCalculators(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/calculators" className="text-sm text-zinc-400 hover:text-zinc-700 flex items-center gap-1">
          <ChevronLeft className="size-4" /> Engineering Tools
        </Link>
      </div>
      <PageHeader title="New Calculator" description="Pick a ready-made tool to start from, or build one from scratch." />
      <CalculatorBuilder
        categories={categories}
        existing={calculators.map((c) => ({ id: c.id, title: c.title }))}
      />
    </div>
  )
}
