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

export function CurrencySelector() {
  const pathname = usePathname()
  const { currency, setCurrency } = useCurrency()

  const showsPrices = PRICED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
  if (!showsPrices) return null

  return (
    <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-semibold overflow-hidden">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setCurrency(opt.value)}
          className={`px-2.5 py-1 transition-colors ${
            currency === opt.value
              ? "bg-primary text-white"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
