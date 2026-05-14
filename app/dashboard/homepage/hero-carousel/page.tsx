import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { getAllHeroSlides } from "@/services/heroSlides.service"
import type { HeroSlide } from "@/services/heroSlides.service"
import { MAX_HERO_SLIDES } from "@/lib/heroSlides.constants"
import HeroCarouselClient from "./HeroCarouselClient"

export const metadata: Metadata = { title: "Hero Carousel | Admin" }

export default async function HeroCarouselPage() {
  let slides: HeroSlide[] = []
  try {
    slides = await getAllHeroSlides()
  } catch {
    // hero_slides table may not exist yet before migration runs
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hero Carousel"
        description={`Manage the homepage hero carousel. Up to ${MAX_HERO_SLIDES} active slides. Slides are shown in order from top to bottom.`}
      />
      <HeroCarouselClient initialSlides={slides} />
    </div>
  )
}
