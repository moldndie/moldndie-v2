import { getAdsForPlacement } from "@/services/ad.service"
import { getSiteSettings } from "@/services/siteSettings.service"
import { clampSeconds } from "@/lib/autoplay"
import { AdCarousel } from "./AdCarousel"

interface AdSlotGridProps {
  page: string
  className?: string
}

export async function AdSlotGrid({ page, className }: AdSlotGridProps) {
  let ads
  try {
    ads = await getAdsForPlacement(page)
  } catch {
    return null
  }

  if (ads.length === 0) return null

  let seconds = 4
  try {
    seconds = clampSeconds((await getSiteSettings()).ads_autoplay_seconds, 4)
  } catch {}

  return <AdCarousel ads={ads} className={className} autoplaySeconds={seconds} />
}
