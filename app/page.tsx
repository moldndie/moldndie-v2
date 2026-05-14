import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import HomeClient from "./HomeClient"
import { getSiteSettings } from "@/services/siteSettings.service"
import { getActiveHeroSlides } from "@/services/heroSlides.service"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"
import type { HeroSlide } from "@/services/heroSlides.service"

export const metadata: Metadata = {
  title: "MoldNdie — Mold & Die Design Resources",
  description:
    "The ultimate resource for plastic injection mold, metal die-casting mold, and sheet metal die design and manufacture know-how.",
}

export default async function HomePage() {
  let counters: { toolings?: string; courses?: string; users?: string; events?: string } = {}
  let heroSlides: HeroSlide[] = []

  try {
    const settings = await getSiteSettings()
    counters = {
      toolings: settings.counter_toolings,
      courses:  settings.counter_courses,
      users:    settings.counter_users,
      events:   settings.counter_events,
    }
  } catch {
    // gracefully degrade if site_settings table doesn't exist yet
  }

  try {
    heroSlides = await getActiveHeroSlides()
  } catch {
    // gracefully degrade if hero_slides table doesn't exist yet
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <HomeClient counters={counters} heroSlides={heroSlides} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AdSlotGrid page="homepage" />
      </div>
      <Footer />
    </div>
  )
}
