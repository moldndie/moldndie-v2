import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

// Always fetch the live member count — do not cache
export const dynamic = "force-dynamic"
import HomeClient from "./HomeClient"
import { getSiteSettings } from "@/services/siteSettings.service"
import { getActiveHeroSlides } from "@/services/heroSlides.service"
import { getActiveOfferItems } from "@/services/homeOfferItems.service"
import { getActiveWhyCards } from "@/services/homeWhyCards.service"
import { getMemberCount } from "@/services/visitorCount.service"
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
  let memberCount  = 0

  await Promise.allSettled([
    getSiteSettings().then((s) => { settings = s }).catch(() => {}),
    getActiveHeroSlides().then((s) => { heroSlides = s }).catch(() => {}),
    getActiveOfferItems().then((s) => { offerItems = s }).catch(() => {}),
    getActiveWhyCards().then((s) => { whyCards = s }).catch(() => {}),
    getMemberCount().then((n)        => { memberCount  = n }).catch(() => {}),
  ])

  // All editable in Site Content → Counters. Members falls back to the real
  // count only when the admin leaves it blank.
  const counters = {
    blog:     settings.counter_blog,
    toolings: settings.counter_toolings,
    courses:  settings.counter_courses,
    events:   settings.counter_events,
    users:    settings.counter_users || (memberCount > 0 ? memberCount.toLocaleString() : undefined),
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
