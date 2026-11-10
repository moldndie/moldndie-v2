import type { Metadata } from "next"
import { ToolsClient, type DirectoryCalculator } from "./ToolsClient"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { getCalculatorBySlug, getCalculators, getCategories } from "@/services/calculator.service"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"
import { nativeCalculatorSlugs } from "./native-calculators"
import theme from "./engineering-theme.module.css"

export const metadata: Metadata = {
  title: "Engineering Tools | MoldNDie",
  description:
    "Free online calculators and tools for plastic injection mold, die casting, and sheet metal die engineering.",
}

export default async function ToolsPage() {
  const [publishedCalculators, categories] = await Promise.all([
    getCalculators({ published: true }).catch(() => []),
    getCategories().catch(() => []),
  ])
  const dbCalculators: DirectoryCalculator[] = publishedCalculators
  // Preview the native tools locally while their public records are unpublished.
  if (process.env.NODE_ENV === "development") {
    const missing = nativeCalculatorSlugs.filter((slug) => !dbCalculators.some((calc) => calc.slug === slug))
    const previews = await Promise.all(missing.map((slug) => getCalculatorBySlug(slug).catch(() => null)))
    for (const calc of previews) {
      if (calc) {
        const { id, slug, title, short_description, category, category_id, is_featured, is_published } = calc
        dbCalculators.push({ id, slug, title, short_description, category, category_id, is_featured, is_published })
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className={`flex-1 ${theme.main}`}>
        <ToolsClient dbCalculators={dbCalculators} categories={categories} />
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <AdSlotGrid page="engineering" />
        </div>
      </main>
      <Footer />
    </div>
  )
}
