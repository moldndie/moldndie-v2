import { getAdsForPlacement } from "@/services/ad.service"
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

  return <AdCarousel ads={ads} className={className} />
}
