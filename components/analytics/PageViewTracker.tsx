"use client"

import { useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { getStoredConsent, dispatchConsent } from "@/components/CookieConsent"
import type { ConsentChoice } from "@/components/CookieConsent"

const VID_KEY  = "mnd_vid"
const SID_KEY  = "mnd_sid"
const STS_KEY  = "mnd_stime"
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 min

function getVisitorId(): string {
  let id = localStorage.getItem(VID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(VID_KEY, id)
  }
  return id
}

function getSessionInfo(): { sessionId: string; isNewSession: boolean } {
  const now       = Date.now()
  const lastTs    = Number(sessionStorage.getItem(STS_KEY) ?? 0)
  const existing  = sessionStorage.getItem(SID_KEY)

  if (existing && now - lastTs < SESSION_TIMEOUT) {
    sessionStorage.setItem(STS_KEY, String(now))
    return { sessionId: existing, isNewSession: false }
  }

  const newId = crypto.randomUUID()
  sessionStorage.setItem(SID_KEY, newId)
  sessionStorage.setItem(STS_KEY, String(now))
  return { sessionId: newId, isNewSession: true }
}

function detectBrowser(ua: string): string {
  if (ua.includes("Edg/"))  return "Edge"
  if (ua.includes("OPR/") || ua.includes("Opera/")) return "Opera"
  if (ua.includes("Chrome/"))  return "Chrome"
  if (ua.includes("Firefox/")) return "Firefox"
  if (ua.includes("Safari/"))  return "Safari"
  return "Other"
}

function detectOS(ua: string): string {
  if (ua.includes("Windows NT")) return "Windows"
  if (ua.includes("Android"))    return "Android"
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS"
  if (ua.includes("Mac OS X"))   return "macOS"
  if (ua.includes("Linux"))      return "Linux"
  return "Other"
}

function detectDevice(ua: string): string {
  if (/iPad/.test(ua))                       return "tablet"
  if (/Mobi|Android|iPhone|iPod/.test(ua))   return "mobile"
  return "desktop"
}

export function PageViewTracker() {
  const pathname    = usePathname()
  const lastTracked = useRef<string | null>(null)
  const consent     = useRef<ConsentChoice | null>(getStoredConsent())

  const track = useCallback((path: string, choice: ConsentChoice) => {
    try {
      const ua = navigator.userAgent

      if (choice === "accepted") {
        // Full tracking with persistent visitor_id
        const visitorId              = getVisitorId()
        const { sessionId, isNewSession } = getSessionInfo()

        fetch("/api/track-pageview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path,
            visitor_id:     visitorId,
            session_id:     sessionId,
            is_new_session: isNewSession,
            referrer:       document.referrer || null,
            language:       navigator.language || null,
            timezone:       Intl.DateTimeFormat().resolvedOptions().timeZone || null,
            browser:        detectBrowser(ua),
            os:             detectOS(ua),
            device_type:    detectDevice(ua),
          }),
        }).catch(() => {})
      } else {
        // Rejected: anonymous page view only — no visitor_id, no session linking
        fetch("/api/track-pageview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path }),
        }).catch(() => {})
      }
    } catch {
      // localStorage/sessionStorage unavailable — skip silently
    }
  }, [])

  // Listen for consent decisions (from cookie modal)
  useEffect(() => {
    function onConsent(e: Event) {
      const choice = (e as CustomEvent<{ choice: ConsentChoice }>).detail.choice
      consent.current = choice
      // Retroactively track the current page now that consent is known
      if (pathname) track(pathname, choice)
    }
    window.addEventListener("mnd:consent", onConsent)
    return () => window.removeEventListener("mnd:consent", onConsent)
  }, [pathname, track])

  // Track on navigation — only if consent is already known
  useEffect(() => {
    if (lastTracked.current === pathname) return
    lastTracked.current = pathname

    const choice = consent.current
    if (!choice) return // wait for user to decide

    track(pathname, choice)
  }, [pathname, track])

  return null
}
