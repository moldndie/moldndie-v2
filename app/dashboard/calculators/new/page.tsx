import { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import PageHeader from "@/components/dashboard/PageHeader"
import { getCategories } from "@/services/calculator.service"
import CalculatorBuilder from "../_components/CalculatorBuilder"

export const metadata: Metadata = { title: "New Calculator | Admin" }

export default async function NewCalculatorPage() {
  const categories = await getCategories()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/calculators" className="text-sm text-zinc-400 hover:text-zinc-700 flex items-center gap-1">
          <ChevronLeft className="size-4" /> Calculators
        </Link>
      </div>
      <PageHeader title="New Calculator" description="Build a dynamic calculator. Start from a template or create from scratch." />
      <CalculatorBuilder categories={categories} />
    </div>
  )
}
