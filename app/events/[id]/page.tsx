import type { Metadata } from "next"
import { Suspense } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import EventDetailClient from "./EventDetailClient"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"

export const metadata: Metadata = {
  title: "Event Details | MoldNdie",
  description: "View event details, date, location, and description.",
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <EventDetailClient eventId={id} />
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <hr className="border-zinc-100 mb-8" />
          <Suspense fallback={null}>
            <AdSlotGrid page="events" className="w-full" />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
