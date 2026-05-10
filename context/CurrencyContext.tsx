"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import type { CurrencyCode } from "@/lib/currency"

const STORAGE_KEY = "mnd_currency"
const DEFAULT: CurrencyCode = "EGP"

interface CurrencyContextValue {
  currency: CurrencyCode
  setCurrency: (c: CurrencyCode) => void
  rates: Record<string, number>
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT,
  setCurrency: () => undefined,
  rates: {},
})

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT)
  const [rates, setRates] = useState<Record<string, number>>({})

  // Read persisted currency on mount (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null
      if (stored === "USD" || stored === "EGP") setCurrencyState(stored)
    } catch {}
  }, [])

  // Fetch exchange rates once on mount
  useEffect(() => {
    fetch("/api/exchange-rates")
      .then((r) => r.json())
      .then((data) => {
        if (data?.rates) setRates(data.rates)
      })
      .catch(() => {})
  }, [])

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c)
    try { localStorage.setItem(STORAGE_KEY, c) } catch {}
  }, [])

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
