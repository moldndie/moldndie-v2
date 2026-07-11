"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

interface AdViewTrackerProps {
  adId: string
  children: React.ReactNode
  href: string
  className?: string
  "aria-label"?: string
}

function getVisitorId(): string | null {
  try { return localStorage.getItem("mnd_vid") } catch { return null }
}

function getSessionId(): string | null {
  try { return sessionStorage.getItem("mnd_sid") } catch { return null }
}

async function trackView(adId: string, pagePath: string) {
  const visitorId = getVisitorId()
  if (!visitorId) return
  try {
    await fetch("/api/track-ad-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ad_id:      adId,
        visitor_id: visitorId,
        session_id: getSessionId(),
        page_path:  pagePath,
      }),
    })
  } catch {
    // fire-and-forget; silent fail
  }
}

export function AdViewTracker({ adId, children, href, className, "aria-label": ariaLabel }: AdViewTrackerProps) {
  const pathname  = usePathname()
  const trackedRef = useRef(false)

  useEffect(() => {
    if (trackedRef.current) return
    trackedRef.current = true
    trackView(adId, pathname)
  }, [adId, pathname])

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </a>
  )
}
