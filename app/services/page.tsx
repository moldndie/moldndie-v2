import type { Metadata } from "next"
import { Suspense } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import ServicesContent from "./ServicesContent"
import PortfolioSection from "./PortfolioSection"
import { getActiveServices } from "@/services/service.service"
import { getActivePortfolioItems } from "@/services/portfolio.service"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"

export const metadata: Metadata = {
  title: "Services | MoldNdie",
  description: "Turnkey project management and engineering services for the mold and die industry. Currently available in Egypt only.",
}

export default async function ServicesPage() {
  const [services, portfolio] = await Promise.all([
    getActiveServices(),
    getActivePortfolioItems().catch(() => []),
  ])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <ServicesContent services={services} />
        <PortfolioSection items={portfolio} />
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <hr className="border-zinc-100 mb-8" />
          <Suspense fallback={null}>
            <AdSlotGrid page="services" className="w-full" />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
