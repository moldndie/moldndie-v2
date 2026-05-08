"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { CoursesTable } from "@/components/tables/CoursesTable"
import AcademyCategoriesClient from "./categories/AcademyCategoriesClient"
import type { AcademyCategory } from "@/services/academyCategory.service"

type Tab = "courses" | "categories"

interface Props {
  initialCategories: AcademyCategory[]
}

export default function AcademyPageClient({ initialCategories }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("courses")

  const tabs: { id: Tab; label: string }[] = [
    { id: "courses",    label: "Courses" },
    { id: "categories", label: "Categories" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 gap-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "courses" && <CoursesTable />}
      {activeTab === "categories" && (
        <AcademyCategoriesClient initialCategories={initialCategories} />
      )}
    </div>
  )
}
