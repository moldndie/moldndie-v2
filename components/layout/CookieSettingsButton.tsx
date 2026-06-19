"use client"

import { Cookie } from "lucide-react"

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("mnd:open-cookie-settings"))}
      className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
    >
      <Cookie size={12} strokeWidth={1.8} />
      Cookie Settings
    </button>
  )
}
