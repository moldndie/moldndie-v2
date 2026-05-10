"use client"

import { useCurrency } from "@/context/CurrencyContext"
import type { CurrencyCode } from "@/lib/currency"

const OPTIONS: { value: CurrencyCode; label: string }[] = [
  { value: "EGP", label: "EGP" },
  { value: "USD", label: "USD" },
]

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()

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
