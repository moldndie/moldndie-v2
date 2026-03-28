"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

export function PageViewTracker() {
  const pathname = usePathname()
  const lastTracked = useRef<string | null>(null)

  useEffect(() => {
    if (lastTracked.current === pathname) return
    lastTracked.current = pathname

    // Fire-and-forget — never blocks rendering
    fetch("/api/track-pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {/* silent */})
  }, [pathname])

  return null
}
