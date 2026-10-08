"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getFileUrl } from "@/lib/utils"
import { AdViewTracker } from "./AdViewTracker"
import type { Ad } from "@/types"

const SLIDE_MS = 600
const GAP_PX = 16

/** Circular arrow pinned to the vertical middle of the card row, half outside it. */
const ARROW_CLASS =
  "ui-pill absolute top-1/2 z-10 hidden -translate-y-1/2 size-9 items-center justify-center " +
  "rounded-full border shadow-sm sm:flex"

const CARD_CLASS =
  "group block shrink-0 rounded-2xl border border-zinc-100 bg-white p-3 transition-colors duration-200 hover:border-zinc-200 hover:shadow-lg"

/** Cards are 1/2/3 across — the card width is derived from this too. */
function cardsPerView(): number {
  if (typeof window === "undefined") return 1
  if (window.matchMedia("(min-width: 1024px)").matches) return 3
  if (window.matchMedia("(min-width: 640px)").matches) return 2
  return 1
}

function CardBody({ ad }: { ad: Ad }) {
  return (
    <>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl">
        <Image
          src={getFileUrl(ad.image_path)}
          alt={ad.title}
          fill
          className="object-contain transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      {ad.title && (
        <p className="mt-2.5 line-clamp-1 text-xs font-medium text-zinc-500 transition-colors group-hover:text-zinc-700">
          {ad.title}
        </p>
      )}
    </>
  )
}

/**
 * Endless one-card-at-a-time strip. The track holds [tail clones | ads | head
 * clones]; it slides one card per step, and when it lands on a clone it snaps
 * (no transition) to the identical real card, so the loop has no visible seam.
 * Independent of the listing above — pagination/filtering never moves it.
 */
export function AdCarousel({ ads, className, autoplaySeconds = 4 }: { ads: Ad[]; className?: string; autoplaySeconds?: number }) {
  const [perView, setPerView] = useState(1)
  const [offset, setOffset] = useState(0) // steps from the first real card
  const [animate, setAnimate] = useState(true)
  const [paused, setPaused] = useState(false)
  const busyRef = useRef(false)

  const n = ads.length
  const loop = n > perView
  const pos = perView + offset // index into the cloned track

  useEffect(() => {
    const sync = () => setPerView(cardsPerView())
    sync()
    window.addEventListener("resize", sync)
    return () => window.removeEventListener("resize", sync)
  }, [])

  const step = useCallback(
    (dir: 1 | -1) => {
      if (busyRef.current) return
      busyRef.current = true
      setAnimate(true)
      setOffset((o) => o + dir)
    },
    [],
  )

  useEffect(() => {
    if (!loop || paused) return
    const id = setInterval(() => step(1), autoplaySeconds * 1000)
    return () => clearInterval(id)
  }, [loop, paused, step, autoplaySeconds])

  // Landed on a clone → jump to its twin without animating.
  function onTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    busyRef.current = false
    if (offset >= n || offset < 0) {
      setAnimate(false)
      setOffset((offset + n) % n)
    }
  }

  const items = loop
    ? [
        ...ads.slice(-perView).map((ad) => ({ ad, clone: true })),
        ...ads.map((ad) => ({ ad, clone: false })),
        ...ads.slice(0, perView).map((ad) => ({ ad, clone: true })),
      ]
    : ads.map((ad) => ({ ad, clone: false }))

  const cardWidth = `calc((100% - ${GAP_PX * (perView - 1)}px) / ${perView})`
  const shift = loop ? `calc(${pos} * -1 * (100% + ${GAP_PX}px) / ${perView})` : "0px"

  return (
    <div className={className}>
      <p className="mb-3 select-none text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
        Sponsored
      </p>

      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {loop && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous ad"
              className={ARROW_CLASS + " left-0 -translate-x-1/2"}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next ad"
              className={ARROW_CLASS + " right-0 translate-x-1/2"}
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        <div className="overflow-hidden py-1">
          <div
            className="flex"
            style={{
              gap: GAP_PX,
              transform: `translateX(${shift})`,
              transition: animate ? `transform ${SLIDE_MS}ms cubic-bezier(0.32, 0.72, 0, 1)` : "none",
            }}
            onTransitionEnd={onTransitionEnd}
          >
            {items.map(({ ad, clone }, i) =>
              clone ? (
                // Clones are never counted as views — the real card is.
                <a
                  key={`c-${i}`}
                  href={ad.link}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  aria-hidden
                  tabIndex={-1}
                  className={CARD_CLASS}
                  style={{ width: cardWidth }}
                >
                  <CardBody ad={ad} />
                </a>
              ) : (
                <AdViewTracker
                  key={ad.id}
                  adId={ad.id}
                  href={ad.link}
                  aria-label={ad.title}
                  className={CARD_CLASS}
                  style={{ width: cardWidth }}
                >
                  <CardBody ad={ad} />
                </AdViewTracker>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
