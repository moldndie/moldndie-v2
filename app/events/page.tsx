import { Suspense } from "react"
import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import EventsListingClient from "./EventsListingClient"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"

export const metadata: Metadata = {
  title: "Events | MoldNdie",
  description: "Explore upcoming and past mold and die industry events from around the world.",
}

export default function EventsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Suspense>
          <EventsListingClient />
        </Suspense>
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
