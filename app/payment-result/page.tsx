"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle, Download, Loader2 } from "lucide-react"

type OrderItem = {
  id: string
  product_id: string
  product_type: "mold" | "course"
  title: string
  price: number
}

function PaymentSuccessContent({ orderId, amount }: { orderId: string | null; amount: string | null }) {
  const [items, setItems] = useState<OrderItem[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setItems(data.items)
      })
      .catch(() => {})
  }, [orderId])

  async function handleDownload(item: OrderItem) {
    if (item.product_type !== "mold") return
    setIsDownloading(true)
    setDownloadError(null)
    try {
      const res = await fetch("/api/download-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moldId: item.product_id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setDownloadError(data.error ?? "Download failed.")
        return
      }
      const a = document.createElement("a")
      a.href = data.downloadUrl
      a.download = item.title
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      setDownloadError("Network error. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  const singleMold = items.length === 1 && items[0].product_type === "mold" ? items[0] : null

  return (
    <div className="flex flex-col items-center text-center">
      <CheckCircle size={72} className="text-emerald-500 mb-6" strokeWidth={1.5} />
      <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">Payment Successful</h1>
      <p className="text-zinc-500 text-sm mb-1">Your order is confirmed.</p>
      {amount && (
        <p className="text-zinc-400 text-xs mb-8">Amount paid: ${amount}</p>
      )}
      {!amount && <div className="mb-8" />}

      {downloadError && (
        <p className="text-sm text-red-500 mb-4">{downloadError}</p>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {singleMold ? (
          <button
            onClick={() => handleDownload(singleMold)}
            disabled={isDownloading}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors"
          >
            {isDownloading ? (
              <><Loader2 size={16} className="animate-spin" /> Preparing…</>
            ) : (
              <><Download size={16} /> Download Now</>
            )}
          </button>
        ) : items.length > 1 ? (
          <Link
            href="/purchases"
            className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors"
          >
            Go to My Purchases
          </Link>
        ) : null}

        <Link
          href="/purchases"
          className="inline-flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-sm px-8 py-3 rounded-xl transition-colors"
        >
          View My Purchases
        </Link>
      </div>
    </div>
  )
}

function PaymentFailedContent() {
  return (
    <div className="flex flex-col items-center text-center">
      <XCircle size={72} className="text-red-400 mb-6" strokeWidth={1.5} />
      <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">Payment Failed</h1>
      <p className="text-zinc-500 text-sm mb-8">
        Something went wrong. Your card was not charged.
      </p>
      <Link
        href="/cart"
        className="inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors"
      >
        Try Again
      </Link>
    </div>
  )
}

function PaymentResultContent() {
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get("success") === "true"
  const orderId = searchParams.get("order")
  const amountCents = searchParams.get("amount_cents")
  const amount = amountCents ? (Number(amountCents) / 100).toFixed(2) : null

  if (isSuccess) {
    return <PaymentSuccessContent orderId={orderId} amount={amount} />
  }

  return <PaymentFailedContent />
}

export default function PaymentResultPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20 bg-white">
      <Suspense>
        <PaymentResultContent />
      </Suspense>
    </div>
  )
}
