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
import { getMemberCount, getContentCounts } from "@/services/visitorCount.service"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"
import type { HeroSlide } from "@/services/heroSlides.service"
import type { HomeOfferItem } from "@/services/homeOfferItems.service"
import type { HomeWhyCard } from "@/services/homeWhyCards.service"
import type { SiteSettings } from "@/services/siteSettings.service"
import { isHrefEnabled, parseDisabled } from "@/lib/modules"

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
  let real = { blog: 0, toolings: 0, courses: 0, events: 0 }

  await Promise.allSettled([
    getSiteSettings().then((s) => { settings = s }).catch(() => {}),
    getActiveHeroSlides().then((s) => { heroSlides = s }).catch(() => {}),
    getActiveOfferItems().then((s) => { offerItems = s }).catch(() => {}),
    getActiveWhyCards().then((s) => { whyCards = s }).catch(() => {}),
    getContentCounts().then((c) => { real = c }).catch(() => {}),
    getMemberCount().then((n)        => { memberCount  = n }).catch(() => {}),
  ])

  // Modules switched off in Site Content → Modules leave no trace here:
  // their offer cards, hero buttons and counters all go.
  const disabled = parseDisabled(settings.disabled_modules)
  const on = (href: string | null) => !href || isHrefEnabled(href, disabled)
  offerItems = offerItems.filter((o) => on(o.button_url))
  heroSlides = heroSlides.map((s) => (on(s.button_link) ? s : { ...s, button_text: null, button_link: null }))
  const off = (key: string) => disabled.includes(key)

  // Editable in Site Content → Counters. A blank field is never hidden: it
  // falls back to the real number, then to the default shown in the admin form.
  const pick = (custom: string | undefined, actual: number, def: string) =>
    custom?.trim() || (actual > 0 ? actual.toLocaleString() : def)
  const counters = {
    blog:     pick(settings.counter_blog,     real.blog,     "100+"),
    toolings: off("molds")   ? "" : pick(settings.counter_toolings, real.toolings, "200+"),
    courses:  off("courses") ? "" : pick(settings.counter_courses,  real.courses,  "50+"),
    events:   off("events")  ? "" : pick(settings.counter_events,   real.events,   "30+"),
    users:    pick(settings.counter_users,    memberCount,   "1,000+"),
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
