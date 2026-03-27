import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import MoldProductClient from "./MoldProductClient"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"

export const metadata: Metadata = {
  title: "Mold Details | MoldNdie",
  description: "View mold details, gallery, and download or purchase this design.",
}

export default async function MoldProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <MoldProductClient moldId={id} />
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <hr className="border-zinc-100 mb-8" />
          <AdSlotGrid type="mold" className="w-full" />
        </div>
      </main>
      <Footer />
    </div>
  )
}
