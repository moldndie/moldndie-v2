"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import CalculatorsTable from "./_components/CalculatorsTable"
import CalcCategoriesClient from "./categories/CalcCategoriesClient"
import type { Calculator, CalcCategory } from "@/types/calculator"

type Tab = "calculators" | "categories"

type Row = Calculator & { category: CalcCategory | null }

interface Props {
  initialCalculators: Row[]
  initialCategories: CalcCategory[]
  defaultTab?: Tab
}

export default function CalculatorsPageClient({
  initialCalculators,
  initialCategories,
  defaultTab = "calculators",
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab)

  const tabs: { id: Tab; label: string }[] = [
    { id: "calculators", label: "Engineering Tools" },
    { id: "categories",  label: "Categories" },
  ]

  return (
    <div className="space-y-6">
      {/* Tab bar + action */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 gap-1">
          {tabs.map((tab) => (
            <button aria-pressed={activeTab === tab.id}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="ui-pill rounded-lg border px-4 py-1.5 text-sm font-medium"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "calculators" && (
          <Link
            href="/dashboard/calculators/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            New Engineering Tool
          </Link>
        )}
      </div>

      {/* Tab content */}
      {activeTab === "calculators" && (
        <CalculatorsTable initialData={initialCalculators} />
      )}

      {activeTab === "categories" && (
        <CalcCategoriesClient initialCategories={initialCategories} />
      )}
    </div>
  )
}
