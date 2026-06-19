"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cookie, Shield, BarChart3, ChevronDown, CheckCircle2 } from "lucide-react"

export const CONSENT_KEY = "mnd_cookie_consent"
export type ConsentChoice = "accepted" | "rejected"

export function dispatchConsent(choice: ConsentChoice) {
  window.dispatchEvent(new CustomEvent("mnd:consent", { detail: { choice } }))
}

export function getStoredConsent(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY)
    if (v === "accepted" || v === "rejected") return v
  } catch { /* private mode / SSR */ }
  return null
}

// ── Expandable category row ─────────────────────────────────────────────────
function CategoryRow({
  id, icon, label, badge, badgeColor, open, onToggle, children,
}: {
  id: string
  icon: React.ReactNode
  label: string
  badge: string
  badgeColor: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-zinc-200 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`cookie-${id}`}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-zinc-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-sm font-semibold text-zinc-800">{label}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
            {badge}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-zinc-400 transition-transform duration-200 shrink-0 ml-2 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`cookie-${id}`}
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-4 pt-3 pb-4 text-sm text-zinc-500 leading-relaxed border-t border-zinc-100 bg-zinc-50/70">
              {children}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export function CookieConsent() {
  const [show, setShow]         = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [decided, setDecided]   = useState(false)

  useEffect(() => {
    if (!getStoredConsent()) {
      const t = setTimeout(() => setShow(true), 700)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    function handleReopen() {
      setDecided(false)
      setExpanded(null)
      setShow(true)
    }
    window.addEventListener("mnd:open-cookie-settings", handleReopen)
    return () => window.removeEventListener("mnd:open-cookie-settings", handleReopen)
  }, [])

  function decide(choice: ConsentChoice) {
    try { localStorage.setItem(CONSENT_KEY, choice) } catch { /* private mode */ }
    dispatchConsent(choice)
    setDecided(true)
    setTimeout(() => setShow(false), 1200)
  }

  return (
    <AnimatePresence>
      {show && (
        /* Bottom-fixed slide-up panel — no blocking full-screen overlay */
        <div
          className="fixed bottom-0 inset-x-0 z-200 flex justify-center px-4 pb-5"
          aria-live="polite"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-title"
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0,  opacity: 1, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }}
            exit={{   y: 32, opacity: 0, transition: { duration: 0.22, ease: "easeIn" } }}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-[0_-4px_32px_rgba(0,0,0,0.12)] border border-zinc-200 overflow-hidden"
          >
            {/* ── Coloured header strip ── */}
            <div className="bg-[#5C1515] px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cookie size={15} className="text-white/70" strokeWidth={1.8} />
                <span id="cookie-title" className="text-sm font-bold text-white">
                  Cookie &amp; Privacy Settings
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield size={12} className="text-white/35" strokeWidth={1.8} />
                <span className="text-[10px] text-white/35 font-bold uppercase tracking-widest">GDPR</span>
              </div>
            </div>

            {/* ── Body ── */}
            {decided ? (
              <div className="px-6 py-8 flex flex-col items-center gap-3 text-center">
                <CheckCircle2 size={36} className="text-emerald-500" strokeWidth={1.5} />
                <p className="text-sm font-semibold text-zinc-800">Preferences saved</p>
                <p className="text-xs text-zinc-400">Applied to all future visits.</p>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                {/* Intro */}
                <div>
                  <h2 className="text-[15px] font-bold text-zinc-900 mb-1.5">We respect your privacy</h2>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    MoldNdie uses cookies and browser storage to deliver core features and understand
                    how our platform is used. Choose which categories to allow below.
                  </p>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <CategoryRow
                    id="essential"
                    icon={<span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                    label="Essential"
                    badge="Always Active"
                    badgeColor="bg-emerald-100 text-emerald-700"
                    open={expanded === "essential"}
                    onToggle={() => setExpanded((p) => p === "essential" ? null : "essential")}
                  >
                    Required for the platform to function — authentication sessions, shopping cart,
                    security tokens, and language preferences. These cannot be disabled.
                  </CategoryRow>

                  <CategoryRow
                    id="analytics"
                    icon={<BarChart3 size={14} className="text-zinc-400 shrink-0" strokeWidth={1.8} />}
                    label="Analytics"
                    badge="Optional"
                    badgeColor="bg-zinc-100 text-zinc-500"
                    open={expanded === "analytics"}
                    onToggle={() => setExpanded((p) => p === "analytics" ? null : "analytics")}
                  >
                    Helps us understand which pages are most useful. We store an{" "}
                    <strong className="text-zinc-700">anonymous</strong> identifier in your browser
                    — no name, email, or IP address is ever collected. If you decline, page views
                    are still counted without linking them across sessions.
                  </CategoryRow>
                </div>

                {/* Footer note + actions in one row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                  <p className="text-[11px] text-zinc-400 sm:flex-1 leading-relaxed">
                    Read our{" "}
                    <a href="/privacy-policy" className="text-primary hover:underline font-semibold">
                      Privacy Policy
                    </a>
                    . Change preferences anytime via the footer.
                  </p>
                  <div className="flex gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => decide("rejected")}
                      className="px-5 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-semibold text-zinc-600 hover:border-zinc-400 hover:text-zinc-800 transition-colors whitespace-nowrap"
                    >
                      Reject Non-Essential
                    </button>
                    <button
                      type="button"
                      onClick={() => decide("accepted")}
                      className="px-5 py-2.5 rounded-xl bg-[#5C1515] hover:bg-[#7C2020] text-white text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
                    >
                      Accept All
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
