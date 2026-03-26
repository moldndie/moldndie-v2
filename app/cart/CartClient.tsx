"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Trash2, ShoppingCart, Package, AlertCircle, Loader2 } from "lucide-react"
import { useCartStore } from "@/store/useCartStore"

const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

export default function CartClient() {
  const { items, removeItem, clearCart } = useCartStore()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const total = items.reduce((sum, item) => sum + item.price, 0)

  async function handleCheckout() {
    setIsCheckingOut(true)
    setCheckoutError(null)

    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ id: item.id, type: item.type })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setCheckoutError(data.error ?? "Checkout failed. Please try again.")
        return
      }

      // Redirect to Paymob hosted checkout
      window.location.href = data.paymentUrl
    } catch {
      setCheckoutError("Network error. Please try again.")
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-6">
        <ShoppingCart size={56} className="text-zinc-200 mb-4" strokeWidth={1} />
        <p className="text-zinc-700 font-semibold text-lg">Your cart is empty</p>
        <p className="text-zinc-400 text-sm mt-1">Browse molds and courses to add items.</p>
        <Link
          href="/molds"
          className="mt-6 inline-block bg-primary text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
        >
          Browse Molds
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-zinc-900">Your Cart</h1>
        <button
          onClick={clearCart}
          className="text-xs text-zinc-400 hover:text-red-500 underline underline-offset-2 transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Items */}
      <ul className="space-y-4">
        {items.map((item) => {
          const imgSrc = item.image ? `${R2_BASE}/${item.image}` : null
          return (
            <li
              key={`${item.type}-${item.id}`}
              className="flex items-center gap-4 bg-white border border-zinc-100 rounded-xl p-4 shadow-sm"
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-50 border border-zinc-100 shrink-0 relative">
                {imgSrc ? (
                  <Image
                    src={imgSrc}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={24} className="text-zinc-300" strokeWidth={1} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">{item.title}</p>
                <p className="text-xs text-zinc-400 capitalize mt-0.5">{item.type}</p>
              </div>

              {/* Price */}
              <span className="text-sm font-bold text-zinc-900 shrink-0">
                ${item.price.toFixed(2)}
              </span>

              {/* Remove */}
              <button
                onClick={() => removeItem(item.id, item.type)}
                className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                aria-label={`Remove ${item.title}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          )
        })}
      </ul>

      {/* Divider */}
      <div className="border-t border-zinc-100" />

      {/* Total + Checkout */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-base">
          <span className="font-semibold text-zinc-700">Total</span>
          <span className="text-2xl font-extrabold text-zinc-900">${total.toFixed(2)}</span>
        </div>

        {checkoutError && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {checkoutError}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={isCheckingOut}
          className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-xl transition-colors shadow-sm"
        >
          {isCheckingOut ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Preparing checkout…
            </>
          ) : (
            <>
              <ShoppingCart size={18} />
              Checkout — ${total.toFixed(2)}
            </>
          )}
        </button>

        <p className="text-center text-xs text-zinc-400">
          Secure checkout · Instant access after payment
        </p>
      </div>
    </div>
  )
}
