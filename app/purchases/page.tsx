"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Package,
  ShoppingBag,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Box,
} from "lucide-react"
import type { PurchasedItem } from "@/app/api/orders/completed/route"

const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

type Order = {
  order_id: string
  purchased_at: string
  total: number
  items: PurchasedItem[]
}

function groupByOrder(items: PurchasedItem[]): Order[] {
  const map = new Map<string, Order>()
  for (const item of items) {
    if (!map.has(item.order_id)) {
      map.set(item.order_id, {
        order_id: item.order_id,
        purchased_at: item.purchased_at,
        total: 0,
        items: [],
      })
    }
    const order = map.get(item.order_id)!
    order.items.push(item)
    order.total += item.price
  }
  return Array.from(map.values())
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function PurchasesPage() {
  const [items, setItems] = useState<PurchasedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [downloadErrors, setDownloadErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/orders/completed")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setFetchError(data.error)
        else setItems(data.items ?? [])
      })
      .catch(() => setFetchError("Failed to load purchases."))
      .finally(() => setIsLoading(false))
  }, [])

  async function handleDownload(item: PurchasedItem) {
    if (item.product_type !== "mold") return
    setDownloading(item.id)
    setDownloadErrors((prev) => ({ ...prev, [item.id]: "" }))

    try {
      const res = await fetch("/api/download-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moldId: item.product_id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setDownloadErrors((prev) => ({ ...prev, [item.id]: data.error ?? "Download failed." }))
        return
      }
      const a = document.createElement("a")
      a.href = data.downloadUrl
      a.download = item.title
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      setDownloadErrors((prev) => ({ ...prev, [item.id]: "Network error." }))
    } finally {
      setDownloading(null)
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-6 animate-pulse">
        <div className="h-8 w-44 bg-zinc-200 rounded-lg" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div className="space-y-2">
                <div className="h-3.5 w-24 bg-zinc-200 rounded" />
                <div className="h-3 w-16 bg-zinc-100 rounded" />
              </div>
              <div className="h-6 w-20 bg-zinc-100 rounded-full" />
            </div>
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="flex gap-4 px-5 py-4 border-b border-zinc-50 last:border-0">
                <div className="w-14 h-14 bg-zinc-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 bg-zinc-200 rounded w-2/3" />
                  <div className="h-3 bg-zinc-100 rounded w-1/4" />
                </div>
                <div className="w-24 h-8 bg-zinc-200 rounded-lg shrink-0 self-center" />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-6">
        <AlertCircle size={48} className="text-red-300 mb-4" strokeWidth={1} />
        <p className="text-zinc-700 font-semibold">{fetchError}</p>
      </div>
    )
  }

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-6">
        <div className="w-20 h-20 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-5">
          <ShoppingBag size={32} className="text-zinc-300" strokeWidth={1.5} />
        </div>
        <p className="text-zinc-900 font-bold text-lg">No purchases yet</p>
        <p className="text-zinc-400 text-sm mt-1.5 max-w-xs">
          Items you buy — molds and courses — will appear here.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  const orders = groupByOrder(items)

  // ── Orders ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
      <h1 className="text-2xl font-extrabold text-zinc-900">My Purchases</h1>

      <div className="space-y-5">
        {orders.map((order) => (
          <div
            key={order.order_id}
            className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Order header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/60">
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  {formatDate(order.purchased_at)}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {order.items.length} {order.items.length === 1 ? "item" : "items"} · ${order.total.toFixed(2)}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-3 py-1 rounded-full">
                <CheckCircle2 size={12} />
                Completed
              </span>
            </div>

            {/* Order items */}
            <ul className="divide-y divide-zinc-50">
              {order.items.map((item) => {
                const imgSrc = item.image ? `${R2_BASE}/${item.image}` : null
                const isThisDownloading = downloading === item.id
                const err = downloadErrors[item.id]

                return (
                  <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 shrink-0 relative">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={22} className="text-zinc-300" strokeWidth={1} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{item.title}</p>
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-zinc-400 capitalize">
                        {item.product_type === "mold" ? (
                          <Box size={11} className="shrink-0" />
                        ) : (
                          <BookOpen size={11} className="shrink-0" />
                        )}
                        {item.product_type}
                      </span>
                      {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
                    </div>

                    {/* Download */}
                    {item.product_type === "mold" && (
                      <button
                        onClick={() => handleDownload(item)}
                        disabled={isThisDownloading}
                        className="shrink-0 flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        {isThisDownloading ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Download size={13} />
                        )}
                        Download
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
