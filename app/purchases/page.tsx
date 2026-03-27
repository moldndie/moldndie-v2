"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Package, ShoppingBag, Download, Loader2, AlertCircle } from "lucide-react"
import type { PurchasedItem } from "@/app/api/orders/completed/route"

const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

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
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-4 animate-pulse">
        <div className="h-7 w-40 bg-zinc-200 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 bg-white border border-zinc-100 rounded-xl p-4">
            <div className="w-16 h-16 bg-zinc-200 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-zinc-200 rounded w-3/4" />
              <div className="h-3 bg-zinc-100 rounded w-1/4" />
            </div>
            <div className="w-24 h-9 bg-zinc-200 rounded-lg shrink-0 self-center" />
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
        <ShoppingBag size={56} className="text-zinc-200 mb-4" strokeWidth={1} />
        <p className="text-zinc-700 font-semibold text-lg">No purchases yet</p>
        <p className="text-zinc-400 text-sm mt-1">Items you buy will appear here.</p>
      </div>
    )
  }

  // ── List ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-extrabold text-zinc-900">My Purchases</h1>

      <ul className="space-y-3">
        {items.map((item) => {
          const imgSrc = item.image ? `${R2_BASE}/${item.image}` : null
          const isThisDownloading = downloading === item.id
          const err = downloadErrors[item.id]

          return (
            <li
              key={item.id}
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
                <p className="text-xs text-zinc-400 capitalize mt-0.5">{item.product_type}</p>
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
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  Download
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
