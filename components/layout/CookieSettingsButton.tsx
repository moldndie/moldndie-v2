"use client"

import { Cookie } from "lucide-react"

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("mnd:open-cookie-settings"))}
      className="inline-flex items-center gap-1.5 text-xs text-white/40 [@media(hover:hover)]:hover:text-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <Cookie size={12} strokeWidth={1.8} />
      Cookie Settings
    </button>
  )
}
