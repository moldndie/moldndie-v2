import { createAdminClient } from "@/lib/supabase/admin"

export type CurrencyCode = "USD" | "EGP"

// ── Exchange rate fetch (server-side only) ────────────────────────────────────

let _cachedRates: Record<string, number> | null = null
let _cacheTs = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getExchangeRates(): Promise<Record<string, number>> {
  if (_cachedRates && Date.now() - _cacheTs < CACHE_TTL) return _cachedRates

  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("exchange_rates")
      .select("from_currency, to_currency, rate")

    if (data) {
      const map: Record<string, number> = {}
      for (const row of data) {
        map[`${row.from_currency}_${row.to_currency}`] = row.rate
      }
      _cachedRates = map
      _cacheTs = Date.now()
      return map
    }
  } catch {
    // graceful degradation
  }

  return {}
}

// ── Client-side utility ───────────────────────────────────────────────────────

/**
 * Convert a price from its original currency to the selected display currency.
 * Returns null if conversion is not possible (missing rate).
 */
export function convertPrice(
  amount: number | null | undefined,
  originalCurrency: CurrencyCode,
  selectedCurrency: CurrencyCode,
  rates: Record<string, number>
): number | null {
  if (amount == null) return null
  if (originalCurrency === selectedCurrency) return amount

  const key = `${originalCurrency}_${selectedCurrency}`
  const rate = rates[key]
  if (!rate) return null

  return amount * rate
}

/**
 * Format a price with the correct currency symbol/prefix.
 * USD → $1,200   EGP → EGP 5,000
 */
export function formatPrice(
  amount: number | null | undefined,
  currency: CurrencyCode
): string {
  if (amount == null) return "—"
  if (amount === 0) return "Free"

  const formatted = amount.toLocaleString("en-US", {
    maximumFractionDigits: currency === "EGP" ? 0 : 2,
    minimumFractionDigits: 0,
  })

  if (currency === "USD") return `$${formatted}`
  return `EGP ${formatted}`
}

/**
 * All-in-one: convert then format. Falls back to original if no rate.
 */
export function displayPrice(
  amount: number | null | undefined,
  originalCurrency: CurrencyCode,
  selectedCurrency: CurrencyCode,
  rates: Record<string, number>
): { text: string; isFree: boolean } {
  if (amount == null || amount === 0) return { text: "Free", isFree: true }

  const converted = convertPrice(amount, originalCurrency, selectedCurrency, rates)
  if (converted === null) {
    // fallback to original
    return { text: formatPrice(amount, originalCurrency), isFree: false }
  }

  return { text: formatPrice(converted, selectedCurrency), isFree: false }
}
