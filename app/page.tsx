import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import HomeClient from "./HomeClient"
import { getSiteSettings } from "@/services/siteSettings.service"
import { getActiveHeroSlides } from "@/services/heroSlides.service"
import { getActiveOfferItems } from "@/services/homeOfferItems.service"
import { getActiveWhyCards } from "@/services/homeWhyCards.service"
import { getTotalVisitorCount } from "@/services/visitorCount.service"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"
import type { HeroSlide } from "@/services/heroSlides.service"
import type { HomeOfferItem } from "@/services/homeOfferItems.service"
import type { HomeWhyCard } from "@/services/homeWhyCards.service"
import type { SiteSettings } from "@/services/siteSettings.service"

export const metadata: Metadata = {
  title: "MoldNdie — Mold & Die Design Resources",
  description:
    "The ultimate resource for plastic injection mold, metal die-casting mold, and sheet metal die design and manufacture know-how.",
}

export default async function HomePage() {
  let settings: SiteSettings = {}
  let heroSlides: HeroSlide[] = []
  let offerItems: HomeOfferItem[] = []
  let whyCards: HomeWhyCard[] = []
  let visitorCount = 0

  await Promise.allSettled([
    getSiteSettings().then((s) => { settings = s }).catch(() => {}),
    getActiveHeroSlides().then((s) => { heroSlides = s }).catch(() => {}),
    getActiveOfferItems().then((s) => { offerItems = s }).catch(() => {}),
    getActiveWhyCards().then((s) => { whyCards = s }).catch(() => {}),
    getTotalVisitorCount().then((n) => { visitorCount = n }).catch(() => {}),
  ])

  const counters = {
    toolings: settings.counter_toolings,
    courses:  settings.counter_courses,
    users:    settings.counter_users,
    events:   settings.counter_events,
    visitors: visitorCount > 0 ? visitorCount.toLocaleString() : undefined,
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <HomeClient
        counters={counters}
        heroSlides={heroSlides}
        offerItems={offerItems}
        whyCards={whyCards}
        settings={settings}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AdSlotGrid page="homepage" />
      </div>
      <Footer />
    </div>
  )
}
