"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/lib/queryKeys"

// Enriched cart item — product data is joined server-side from molds/courses tables
export type CartItem = {
  id: string
  user_id: string
  product_id: string
  product_type: "mold" | "course"
  quantity: number
  title: string
  price: number
  image: string | null
  created_at: string
}

type AddToCartInput = {
  product_id: string
  product_type: "mold" | "course"
}

type RemoveFromCartInput = {
  product_id: string
  product_type: "mold" | "course"
}

async function fetchCart(): Promise<CartItem[]> {
  const res = await fetch("/api/cart")
  if (!res.ok) throw new Error("Failed to load cart.")
  const data = await res.json()
  return data.items ?? []
}

async function addToCart(input: AddToCartInput): Promise<void> {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const data = await res.json()
  if (res.status === 401) throw new Error("login_required")
  if (!res.ok) throw new Error(data.error ?? "Failed to add to cart.")
}

async function removeFromCart(input: RemoveFromCartInput): Promise<void> {
  const res = await fetch("/api/cart", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (res.status === 401) throw new Error("login_required")
  if (!res.ok) throw new Error("Failed to remove item.")
}

async function clearCart(): Promise<void> {
  const res = await fetch("/api/cart/clear", { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to clear cart.")
}

export function useCart() {
  return useQuery({
    queryKey: QUERY_KEYS.CART,
    queryFn: fetchCart,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useCartHasItem(productId: string, productType: "mold" | "course") {
  const { data: items = [] } = useCart()
  return items.some((i) => i.product_id === productId && i.product_type === productType)
}

export function useAddToCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addToCart,
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.CART })
      const prev = qc.getQueryData<CartItem[]>(QUERY_KEYS.CART)
      // Optimistically increment quantity if item already exists
      qc.setQueryData<CartItem[]>(QUERY_KEYS.CART, (old = []) => {
        const exists = old.some(
          (i) => i.product_id === input.product_id && i.product_type === input.product_type
        )
        if (exists) {
          return old.map((i) =>
            i.product_id === input.product_id && i.product_type === input.product_type
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        }
        return old
      })
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEYS.CART, ctx.prev)
    },
    // Always refetch to get enriched product data from server
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.CART }),
  })
}

export function useRemoveFromCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: removeFromCart,
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.CART })
      const prev = qc.getQueryData<CartItem[]>(QUERY_KEYS.CART)
      qc.setQueryData<CartItem[]>(QUERY_KEYS.CART, (old = []) =>
        old.filter(
          (i) => !(i.product_id === input.product_id && i.product_type === input.product_type)
        )
      )
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEYS.CART, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.CART }),
  })
}

export function useClearCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: clearCart,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.CART })
      const prev = qc.getQueryData<CartItem[]>(QUERY_KEYS.CART)
      qc.setQueryData(QUERY_KEYS.CART, [])
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEYS.CART, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.CART }),
  })
}
