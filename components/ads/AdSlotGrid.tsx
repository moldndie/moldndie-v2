
import Image from "next/image"
import { getAdsForPlacement } from "@/services/ad.service"
import { getFileUrl } from "@/lib/utils"
import type { AdTargetType } from "@/types"

interface AdSlotGridProps {
  type: AdTargetType
  className?: string
}

export async function AdSlotGrid({ type, className }: AdSlotGridProps) {
  let ads
  try {
    ads = await getAdsForPlacement(type, 3)
  } catch {
    return null
  }

  if (ads.length === 0) return null

  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-3 select-none">
        Sponsored
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ads.map((ad) => (
          <a
            key={ad.id}
            href={ad.link}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label={ad.title}
            className="group block rounded-2xl border border-zinc-100 bg-zinc-50 p-3 hover:border-zinc-200 hover:shadow-lg hover:scale-[1.015] transition-all duration-200"
          >
            <div className="relative w-full overflow-hidden rounded-xl aspect-video">
              <Image
                src={getFileUrl(ad.image_path)}
                alt={ad.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            {ad.title && (
              <p className="mt-2.5 text-xs font-medium text-zinc-500 line-clamp-1 group-hover:text-zinc-700 transition-colors">
                {ad.title}
              </p>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
