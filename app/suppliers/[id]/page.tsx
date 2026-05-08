import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import SupplierDetailClient from "./SupplierDetailClient"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"

export const metadata: Metadata = {
  title: "Supplier Details | MoldNdie",
  description: "View supplier details, contact information, and website.",
}

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <SupplierDetailClient supplierId={id} />
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <hr className="border-zinc-100 mb-8" />
          <AdSlotGrid page="suppliers" className="w-full" />
        </div>
      </main>
      <Footer />
    </div>
  )
}
