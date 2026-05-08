import { Suspense } from "react"
import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import CoursesListingClient from "./CoursesListingClient"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"

export const metadata: Metadata = {
  title: "Academy | MoldNdie",
  description: "Browse professional mold and die industry courses.",
}

export default function CoursesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Suspense>
          <CoursesListingClient />
        </Suspense>
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <hr className="border-zinc-100 mb-8" />
          <Suspense fallback={null}>
            <AdSlotGrid page="academy" className="w-full" />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
