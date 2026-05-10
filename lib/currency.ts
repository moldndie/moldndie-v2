import { createAdminClient } from "@/lib/supabase/admin"

export type CurrencyCode = "USD" | "EGP"

// Hardcoded fallback — used when both live API and DB are unavailable.
// Update periodically if the rate drifts significantly.
export const FALLBACK_RATES: Record<string, number> = {
  "USD_EGP": 49.5,
  "EGP_USD": 1 / 49.5,
}

// ── Exchange rate fetch (server-side only) ────────────────────────────────────

let _cachedRates: Record<string, number> | null = null
let _cacheTs = 0
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function getExchangeRates(): Promise<Record<string, number>> {
  if (_cachedRates && Date.now() - _cacheTs < CACHE_TTL) return _cachedRates

  // 1. Live API — Frankfurter (free, no key required)
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=EGP",
      { signal: controller.signal, cache: "no-store" }
    )
    clearTimeout(timer)
    if (res.ok) {
      const data = await res.json()
      if (typeof data?.rates?.EGP === "number") {
        const usdToEgp: number = data.rates.EGP
        _cachedRates = { "USD_EGP": usdToEgp, "EGP_USD": 1 / usdToEgp }
        _cacheTs = Date.now()
        return _cachedRates
      }
    }
  } catch {
    // fall through to DB
  }

  // 2. Supabase exchange_rates table
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("exchange_rates")
      .select("from_currency, to_currency, rate")

    if (data && data.length > 0) {
      const map: Record<string, number> = {}
      for (const row of data) {
        map[`${row.from_currency}_${row.to_currency}`] = row.rate
      }
      _cachedRates = map
      _cacheTs = Date.now()
      return map
    }
  } catch {
    // fall through to hardcoded fallback
  }

  // 3. Hardcoded fallback — never returns empty
  return FALLBACK_RATES
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
