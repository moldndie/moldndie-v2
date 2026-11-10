"use client"

import { useCallback, useMemo, useState, useSyncExternalStore } from "react"

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener)
  return () => window.removeEventListener("storage", listener)
}

function getServerSnapshot() {
  return null
}

export function useCalculatorPreferences<T>(key: string, restore: (raw: string | null) => T) {
  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  }, [key])
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [edited, setEdited] = useState<T>()
  const state = useMemo(() => edited ?? restore(raw), [edited, raw, restore])

  function update(changes: Partial<T>) {
    const next = { ...state, ...changes }
    setEdited(next)
    try {
      window.localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // Calculations stay available when storage is disabled.
    }
  }

  return [state, update] as const
}
