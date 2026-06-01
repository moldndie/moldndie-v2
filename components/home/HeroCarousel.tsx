"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { HeroSlide } from "@/services/heroSlides.service"
import { isValidImageUrl } from "@/lib/heroSlides.constants"

interface HeroCarouselProps {
  slides: HeroSlide[]
}

const AUTOPLAY_MS = 5000

// Premium cubic-bezier ease for slide transitions — typed as tuple so TS
// maps it to Framer Motion's BezierDefinition rather than number[].
const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1]

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: EASE },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0,
    transition: { duration: 0.6, ease: EASE },
  }),
}

const textVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    // "as const" prevents TS from widening the literal to `string`
    transition: { duration: 0.45, ease: "easeOut" as const, delay },
  }),
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  // Ref lets the interval callback always read the latest index without
  // needing to re-register the interval every time index changes.
  const indexRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback(
    (next: number, dir: number) => {
      const clamped = ((next % slides.length) + slides.length) % slides.length
      indexRef.current = clamped
      setDirection(dir)
      setIndex(clamped)
    },
    [slides.length],
  )

  function advance() {
    goTo(indexRef.current + 1, 1)
  }

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(advance, AUTOPLAY_MS)
  }

  function handlePrev() {
    resetTimer()
    goTo(indexRef.current - 1, -1)
  }

  function handleNext() {
    resetTimer()
    goTo(indexRef.current + 1, 1)
  }

  function handleDot(i: number) {
    resetTimer()
    goTo(i, i > indexRef.current ? 1 : -1)
  }

  useEffect(() => {
    timerRef.current = setInterval(advance, AUTOPLAY_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // advance is stable because indexRef never changes identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length])

  const slide = slides[index]
  const hasText = slide.title || slide.subtitle || slide.button_text

  return (
    <section
      className="relative w-full overflow-hidden bg-zinc-950 select-none"
      style={{ height: "min(56.25vw, 92vh)" }}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.08}
          onDragEnd={(_, info) => {
            if (info.offset.x < -50) handleNext()
            else if (info.offset.x > 50) handlePrev()
          }}
        >
          {/* Responsive images: validated mobile_image on small screens, image_url on ≥sm.
              mobile_image is only used when it passes the URL guard — falls back to
              image_url otherwise, which is already guaranteed valid by HomeClient filter. */}
          {isValidImageUrl(slide.mobile_image) ? (
            <>
              <Image
                src={slide.mobile_image}
                alt={slide.alt_text ?? slide.title ?? `Hero slide ${index + 1}`}
                fill
                priority={index === 0}
                className="object-contain pointer-events-none sm:hidden"
                sizes="100vw"
                draggable={false}
              />
              <Image
                src={slide.image_url}
                alt={slide.alt_text ?? slide.title ?? `Hero slide ${index + 1}`}
                fill
                priority={index === 0}
                className="object-contain pointer-events-none hidden sm:block"
                sizes="100vw"
                draggable={false}
              />
            </>
          ) : (
            <Image
              src={slide.image_url}
              alt={slide.alt_text ?? slide.title ?? `Hero slide ${index + 1}`}
              fill
              priority={index === 0}
              className="object-contain pointer-events-none"
              sizes="100vw"
              draggable={false}
            />
          )}

          {/* Gradient overlay — only rendered when text exists */}
          {hasText && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5 pointer-events-none" />
          )}

          {/* Text + CTA */}
          {hasText && (
            <div className="absolute inset-x-0 bottom-0 pb-20 px-6 flex flex-col items-center text-center pointer-events-none">
              {slide.title && (
                <motion.h2
                  key={`title-${index}`}
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0.15}
                  className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white uppercase leading-tight tracking-tight max-w-4xl drop-shadow-lg"
                >
                  {slide.title}
                </motion.h2>
              )}

              {slide.subtitle && (
                <motion.p
                  key={`sub-${index}`}
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0.28}
                  className="mt-4 text-sm md:text-base text-white/85 max-w-2xl leading-relaxed drop-shadow"
                >
                  {slide.subtitle}
                </motion.p>
              )}

              {slide.button_text && slide.button_link && (
                <motion.div
                  key={`btn-${index}`}
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0.4}
                  className="mt-8 pointer-events-auto"
                >
                  <Link
                    href={slide.button_link}
                    className={buttonVariants({
                      className:
                        "px-10 py-3 h-auto rounded-full text-sm font-semibold tracking-widest uppercase shadow-lg",
                    })}
                  >
                    {slide.button_text}
                  </Link>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next arrows — only if more than 1 slide */}
      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex size-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/55 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <ChevronLeft className="size-5" />
          </button>

          <button
            onClick={handleNext}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex size-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/55 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div
          role="tablist"
          aria-label="Slide navigation"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2"
        >
          {slides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => handleDot(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-400 focus-visible:outline-none",
                i === index
                  ? "w-8 bg-white"
                  : "w-1.5 bg-white/45 hover:bg-white/70",
              )}
            />
          ))}
        </div>
      )}

      {/* Progress bar — shows time until next auto-advance */}
      {slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-10 overflow-hidden">
          <motion.div
            key={index}
            className="h-full bg-white/50"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1, originX: 0 }}
            transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
          />
        </div>
      )}
    </section>
  )
}
