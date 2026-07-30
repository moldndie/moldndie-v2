"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getFileUrl } from "@/lib/utils"
import { AdViewTracker } from "./AdViewTracker"
import type { Ad } from "@/types"

/**
 * Ads are deliberately independent of the page they sit under: the track is a
 * plain scroll container whose position only changes when the arrows are used,
 * so paginating or filtering the listing above never moves the ads.
 */
export function AdCarousel({ ads, className }: { ads: Ad[]; className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  function sync(el: HTMLDivElement) {
    setAtStart(el.scrollLeft <= 1)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  }

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onScroll = () => sync(el)
    onScroll()
    el.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      el.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [ads.length])

  function page(dir: 1 | -1) {
    const el = trackRef.current
    if (!el) return
    // Plain assignment, no smooth behaviour: `scroll-snap-type: mandatory`
    // re-snaps smooth programmatic scrolls back to the first card, and a
    // `scroll-behavior: smooth` container can swallow the assignment entirely.
    el.scrollLeft = Math.max(
      0,
      Math.min(el.scrollLeft + dir * el.clientWidth, el.scrollWidth - el.clientWidth),
    )
    // Programmatic scrolls do not reliably emit a scroll event, so drive the
    // arrow states from here rather than waiting on the listener.
    sync(el)
  }

  const hasArrows = !atStart || !atEnd

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <p className="select-none text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          Sponsored
        </p>
        {hasArrows && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => page(-1)}
              disabled={atStart}
              aria-label="Previous ads"
              className="flex size-7 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-800 disabled:cursor-default disabled:opacity-30 disabled:hover:border-zinc-200 disabled:hover:text-zinc-500"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => page(1)}
              disabled={atEnd}
              aria-label="Next ads"
              className="flex size-7 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-800 disabled:cursor-default disabled:opacity-30 disabled:hover:border-zinc-200 disabled:hover:text-zinc-500"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={trackRef}
        className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 pb-1"
      >
        {ads.map((ad) => (
          <AdViewTracker
            key={ad.id}
            adId={ad.id}
            href={ad.link}
            aria-label={ad.title}
            className="group block shrink-0 rounded-2xl border border-zinc-100 bg-white p-3 transition-all duration-200 hover:scale-[1.015] hover:border-zinc-200 hover:shadow-lg w-[85vw] sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              <Image
                src={getFileUrl(ad.image_path)}
                alt={ad.title}
                fill
                className="object-contain transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            {ad.title && (
              <p className="mt-2.5 line-clamp-1 text-xs font-medium text-zinc-500 transition-colors group-hover:text-zinc-700">
                {ad.title}
              </p>
            )}
          </AdViewTracker>
        ))}
      </div>
    </div>
  )
}
