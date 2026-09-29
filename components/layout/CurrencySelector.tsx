"use client"

import { usePathname } from "next/navigation"
import { useCurrency } from "@/context/CurrencyContext"
import type { CurrencyCode } from "@/lib/currency"

const OPTIONS: { value: CurrencyCode; label: string }[] = [
  { value: "EGP", label: "EGP" },
  { value: "USD", label: "USD" },
]

// The selector only converts what is displayed — checkout always charges EGP.
// So it is only shown where a price is actually on screen: academy courses,
// the mold library, and the cart/checkout/receipt pages.
const PRICED_PATHS = ["/courses", "/molds", "/cart", "/checkout", "/purchases"]

/**
 * True on the pages that put a price on screen. Shared with the navbar cart
 * button so the two only ever appear together — one list, no drift.
 */
export function showsPrices(pathname: string): boolean {
  return PRICED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function CurrencySelector() {
  const pathname = usePathname()
  const { currency, setCurrency } = useCurrency()

  if (!showsPrices(pathname)) return null

  return (
    <div className="flex items-center gap-1 text-xs font-semibold">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setCurrency(opt.value)}
          aria-pressed={currency === opt.value}
          className="ui-pill rounded-md border px-2.5 py-1"
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
