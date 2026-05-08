import { Suspense } from "react"
import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import MoldsListingClient from "./MoldsListingClient"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"

export const metadata: Metadata = {
  title: "Mold Library | MoldNdie",
  description:
    "Browse and download professional plastic injection mold, die-casting mold, and sheet metal die designs.",
}

export default function MoldsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Suspense>
          <MoldsListingClient />
        </Suspense>
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <hr className="border-zinc-100 mb-8" />
          <Suspense fallback={null}>
            <AdSlotGrid page="library" className="w-full" />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
