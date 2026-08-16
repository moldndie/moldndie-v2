"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn, getFileUrl } from "@/lib/utils"
import { useCarousel } from "@/hooks/useCarousel"
import { AdViewTracker } from "./AdViewTracker"
import type { Ad } from "@/types"

const AUTOPLAY_MS = 8000

/** Circular arrow pinned to the vertical middle of the card row, half outside it. */
const ARROW_CLASS =
  "ui-pill absolute top-1/2 z-10 hidden -translate-y-1/2 size-9 items-center justify-center " +
  "rounded-full border shadow-sm sm:flex"

/**
 * Ads advance on their own timer and are otherwise independent of the page they
 * sit under: the track scrolls only from this component's own index, so
 * paginating or filtering the listing above never moves the ads.
 *
 * Unlike the hero, which shows one slide at a time, this shows a row of cards —
 * so a "page" is one viewport-width of cards and the dots count pages, not ads.
 */
/** Cards are 1/2/3 across — mirrors the `sm:`/`lg:` widths on the card itself. */
function cardsPerPage(): number {
  if (typeof window === "undefined") return 1
  if (window.matchMedia("(min-width: 1024px)").matches) return 3
  if (window.matchMedia("(min-width: 640px)").matches) return 2
  return 1
}

export function AdCarousel({ ads, className }: { ads: Ad[]; className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [perPage, setPerPage] = useState(1)

  // Read from the breakpoints rather than measuring the DOM: the card widths
  // are set by those same breakpoints, and a measured clientWidth is 0 while
  // the track is still laying out.
  useEffect(() => {
    const sync = () => setPerPage(cardsPerPage())
    sync()
    window.addEventListener("resize", sync)
    return () => window.removeEventListener("resize", sync)
  }, [])

  const pages = Math.max(1, Math.ceil(ads.length / perPage))
  const { index, next, prev, select } = useCarousel({ length: pages, intervalMs: AUTOPLAY_MS })

  // Scroll the first card of the page to the left edge. Plain assignment, no
  // smooth behaviour: `scroll-snap-type: mandatory` re-snaps smooth
  // programmatic scrolls back to the first card, and a `scroll-behavior:
  // smooth` container can swallow the assignment entirely.
  useEffect(() => {
    const el = trackRef.current
    const first = el?.children[index * perPage] as HTMLElement | undefined
    if (!el || !first) return
    el.scrollLeft = first.offsetLeft - (el.firstElementChild as HTMLElement).offsetLeft
  }, [index, perPage])

  const hasPager = pages > 1

  return (
    <div className={className}>
      <p className="mb-3 select-none text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
        Sponsored
      </p>

      {/* Arrows flank the track rather than sitting in the header, matching the
          homepage hero. `relative` here is what they anchor to. */}
      <div className="relative">
        {hasPager && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous ads"
              className={ARROW_CLASS + " left-0 -translate-x-1/2"}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next ads"
              className={ARROW_CLASS + " right-0 translate-x-1/2"}
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

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

      {/* Dots — same treatment as the homepage hero, tinted for a light background */}
      {hasPager && (
        <div
          role="tablist"
          aria-label="Sponsored slide navigation"
          className="mt-3 flex items-center justify-center gap-2"
        >
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to sponsored slide ${i + 1}`}
              onClick={() => select(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-400 focus-visible:outline-none",
                i === index ? "w-8 bg-zinc-400" : "w-1.5 bg-zinc-200 hover:bg-zinc-300",
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
