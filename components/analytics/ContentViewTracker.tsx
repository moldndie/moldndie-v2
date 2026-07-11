"use client"

import { useEffect, useRef } from "react"

interface ContentViewTrackerProps {
  contentType: "blog" | "course" | "mold" | "event" | "calculator" | "supplier" | "service"
  contentId: string
}

function getVisitorId(): string | null {
  try { return localStorage.getItem("mnd_vid") } catch { return null }
}

function getSessionId(): string | null {
  try { return sessionStorage.getItem("mnd_sid") } catch { return null }
}

export function ContentViewTracker({ contentType, contentId }: ContentViewTrackerProps) {
  const trackedRef = useRef(false)

  useEffect(() => {
    if (trackedRef.current) return
    const visitorId = getVisitorId()
    if (!visitorId) return
    trackedRef.current = true

    fetch("/api/track-content-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content_type: contentType,
        content_id:   contentId,
        visitor_id:   visitorId,
        session_id:   getSessionId(),
      }),
    }).catch(() => {})
  }, [contentType, contentId])

  return null
}
