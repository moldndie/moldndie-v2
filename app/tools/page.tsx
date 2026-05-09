import type { Metadata } from "next"
import { ToolsClient } from "./ToolsClient"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { getCalculators, getCategories } from "@/services/calculator.service"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"

export const metadata: Metadata = {
  title: "Engineering Tools | MoldNDie",
  description:
    "Free online calculators and tools for plastic injection mold, die casting, and sheet metal die engineering.",
}

export default async function ToolsPage() {
  const [dbCalculators, categories] = await Promise.all([
    getCalculators({ published: true }).catch(() => []),
    getCategories().catch(() => []),
  ])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <ToolsClient dbCalculators={dbCalculators} categories={categories} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdSlotGrid page="engineering" />
        </div>
      </main>
      <Footer />
    </div>
  )
}
