"use client"

import { useCurrency } from "@/context/CurrencyContext"
import { displayPrice, type CurrencyCode } from "@/lib/currency"

interface PriceTagProps {
  amount: number | null | undefined
  originalCurrency?: CurrencyCode
  freeClassName?: string
  paidClassName?: string
}

/**
 * Currency-aware price display for server-rendered pages.
 * Server components cannot access React context, so embed this client
 * component wherever a price needs to respond to the currency selector.
 */
export function PriceTag({
  amount,
  originalCurrency = "EGP",
  freeClassName = "text-sm font-bold text-emerald-600",
  paidClassName = "text-sm font-bold text-zinc-900",
}: PriceTagProps) {
  const { currency, rates } = useCurrency()
  const { text, isFree } = displayPrice(amount, originalCurrency, currency, rates)
  return <span className={isFree ? freeClassName : paidClassName}>{text}</span>
}
