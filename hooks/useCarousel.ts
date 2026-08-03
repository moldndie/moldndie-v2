"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface UseCarouselOptions {
  /** Number of slides/pages to cycle through. Autoplay is off when < 2. */
  length: number
  /** Milliseconds between automatic advances. */
  intervalMs?: number
}

/**
 * Index + autoplay timer shared by the hero and ad carousels.
 *
 * Only the timing is shared — the two render completely differently (one
 * full-bleed slide vs. a paged row of cards), so this deliberately owns no DOM.
 *
 * `direction` is the sign of the last move, for slide-in animations.
 */
export function useCarousel({ length, intervalMs = 5000 }: UseCarouselOptions) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  // Lets the interval callback read the current index without re-registering
  // itself on every advance.
  const indexRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback(
    (next: number, dir: number) => {
      if (length < 1) return
      const clamped = ((next % length) + length) % length
      indexRef.current = clamped
      setDirection(dir)
      setIndex(clamped)
    },
    [length],
  )

  const advance = useCallback(() => goTo(indexRef.current + 1, 1), [goTo])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (length > 1) timerRef.current = setInterval(advance, intervalMs)
  }, [advance, intervalMs, length])

  // Manual moves restart the timer, so a slide never flips straight after a click.
  const next = useCallback(() => { resetTimer(); goTo(indexRef.current + 1, 1) }, [goTo, resetTimer])
  const prev = useCallback(() => { resetTimer(); goTo(indexRef.current - 1, -1) }, [goTo, resetTimer])
  const select = useCallback(
    (i: number) => { resetTimer(); goTo(i, i > indexRef.current ? 1 : -1) },
    [goTo, resetTimer],
  )

  useEffect(() => {
    resetTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [resetTimer])

  // Clamped on read rather than corrected via state: a shrinking list (ads
  // re-paged on resize) can leave the stored index past the end, and the next
  // advance wraps it back into range on its own.
  const safeIndex = length > 0 ? Math.min(index, length - 1) : 0

  return { index: safeIndex, direction, next, prev, select, resetTimer }
}
