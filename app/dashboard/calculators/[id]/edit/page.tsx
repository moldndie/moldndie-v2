import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, ExternalLink } from "lucide-react"
import PageHeader from "@/components/dashboard/PageHeader"
import { getCalculatorById, getCategories } from "@/services/calculator.service"
import CalculatorBuilder from "../../_components/CalculatorBuilder"

export const metadata: Metadata = { title: "Edit Engineering Tool | Admin" }

export default async function EditCalculatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [calculator, categories] = await Promise.all([
    getCalculatorById(id),
    getCategories(),
  ])

  if (!calculator) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/calculators" className="text-sm text-zinc-400 hover:text-zinc-700 flex items-center gap-1">
          <ChevronLeft className="size-4" /> Engineering Tools
        </Link>
        <Link
          href={`/tools/${calculator.slug}`}
          target="_blank"
          className="ml-auto text-sm text-zinc-400 hover:text-zinc-700 flex items-center gap-1"
        >
          <ExternalLink className="size-3.5" /> Preview
        </Link>
      </div>
      <PageHeader title={`Edit: ${calculator.title}`} description="Update fields, formulas, and settings." />
      <CalculatorBuilder calculator={calculator} categories={categories} />
    </div>
  )
}
