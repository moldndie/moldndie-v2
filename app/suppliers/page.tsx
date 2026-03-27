import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import SuppliersListingClient from "./SuppliersListingClient"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"

export const metadata: Metadata = {
  title: "Suppliers | MoldNdie",
  description: "Browse our verified network of mold and die suppliers from around the world.",
}

export default function SuppliersPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <SuppliersListingClient />
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <hr className="border-zinc-100 mb-8" />
          <AdSlotGrid type="supplier" className="w-full" />
        </div>
      </main>
      <Footer />
    </div>
  )
}
