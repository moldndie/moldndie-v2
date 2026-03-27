"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { QUERY_KEYS } from "@/lib/queryKeys"

const LS_KEY = "moldndie-cart"

type LegacyCartItem = {
  id: string
  title: string
  price: number
  type: "mold" | "course"
  image: string
}

function readLegacyCart(): LegacyCartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return parsed?.state?.items ?? []
  } catch {
    return []
  }
}

function clearLegacyCart() {
  if (typeof window === "undefined") return
  localStorage.removeItem(LS_KEY)
}

async function migrateItems(items: LegacyCartItem[]) {
  if (items.length === 0) return

  await Promise.allSettled(
    items.map((item) =>
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: item.id,
          product_type: item.type,
          title: item.title,
          price: item.price,
          image: item.image,
        }),
      })
    )
  )
}

export function useCartMigration() {
  const qc = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event !== "SIGNED_IN") return

        const items = readLegacyCart()
        if (items.length === 0) return

        await migrateItems(items)
        clearLegacyCart()
        qc.invalidateQueries({ queryKey: QUERY_KEYS.CART })
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
