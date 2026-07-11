import Image from "next/image"
import { getAdForPlacement } from "@/services/ad.service"
import { getFileUrl } from "@/lib/utils"
import { AdViewTracker } from "./AdViewTracker"

interface AdSlotProps {
  page: string
  className?: string
}

export async function AdSlot({ page, className }: AdSlotProps) {
  let ad
  try {
    ad = await getAdForPlacement(page)
  } catch {
    return null
  }

  if (!ad) return null

  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2 select-none">
        Sponsored
      </p>
      <AdViewTracker
        adId={ad.id}
        href={ad.link}
        aria-label={ad.title}
        className="group block rounded-2xl border border-zinc-100 bg-white p-3 hover:border-zinc-200 hover:shadow-lg hover:scale-[1.015] transition-all duration-200"
      >
        <div className="relative w-full overflow-hidden rounded-xl aspect-video">
          <Image
            src={getFileUrl(ad.image_path)}
            alt={ad.title}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 320px"
          />
        </div>
        {ad.title && (
          <p className="mt-2.5 text-xs font-medium text-zinc-500 line-clamp-1 group-hover:text-zinc-700 transition-colors">
            {ad.title}
          </p>
        )}
      </AdViewTracker>
    </div>
  )
}
