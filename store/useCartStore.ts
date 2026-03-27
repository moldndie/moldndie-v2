"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type CartItem = {
  id: string
  title: string
  price: number
  type: "mold" | "course"
  image: string
}

type CartStore = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string, type: CartItem["type"]) => void
  clearCart: () => void
  hasItem: (id: string, type: CartItem["type"]) => boolean
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const exists = get().items.some((i) => i.id === item.id && i.type === item.type)
        if (exists) return
        set((state) => ({ items: [...state.items, item] }))
      },

      removeItem: (id, type) => {
        set((state) => ({
          items: state.items.filter((i) => !(i.id === id && i.type === type)),
        }))
      },

      clearCart: () => set({ items: [] }),

      hasItem: (id, type) => get().items.some((i) => i.id === id && i.type === type),
    }),
    {
      name: "moldndie-cart",
    }
  )
)
