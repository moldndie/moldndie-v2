import { Suspense } from "react"
import type { Metadata } from "next"
import AcademyCategoriesClient from "./AcademyCategoriesClient"
import { getAcademyCategories } from "@/services/academyCategory.service"

export const metadata: Metadata = { title: "Academy Categories | Dashboard" }

export default async function AcademyCategoriesPage() {
  const categories = await getAcademyCategories().catch(() => [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Academy Categories</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage categories for the Academy courses page.
        </p>
      </div>
      <Suspense fallback={null}>
        <AcademyCategoriesClient initialCategories={categories} />
      </Suspense>
    </div>
  )
}
