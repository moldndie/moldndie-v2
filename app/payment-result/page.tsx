"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle, Download, Loader2, BookOpen, Clock } from "lucide-react"

type OrderItem = {
  id: string
  product_id: string
  product_type: "mold" | "course"
  title: string
  price: number
}

// Poll /api/orders/by-paymob until order.status === "completed" or max attempts reached
async function fetchOrderWithStatus(
  paymobOrderId: string
): Promise<{ status: string; items: OrderItem[] }> {
  const res = await fetch(`/api/orders/by-paymob?paymob_order_id=${paymobOrderId}`)
  const data = await res.json()
  return {
    status: data.order?.status ?? "pending",
    items: data.items ?? [],
  }
}

function PaymentSuccessContent({
  orderId,
  amount,
}: {
  orderId: string | null
  amount: string | null
}) {
  const [items, setItems] = useState<OrderItem[]>([])
  const [confirmed, setConfirmed] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!orderId) return

    // Poll until the HMAC-verified webhook marks the order as completed in DB
    let attempts = 0
    const MAX_ATTEMPTS = 15 // 30 seconds

    async function check() {
      attempts++
      try {
        const { status, items } = await fetchOrderWithStatus(orderId!)
        setItems(items)
        if (status === "completed") {
          setConfirmed(true)
          if (pollRef.current) clearInterval(pollRef.current)
        } else if (attempts >= MAX_ATTEMPTS) {
          setTimedOut(true)
          if (pollRef.current) clearInterval(pollRef.current)
        }
      } catch {
        if (attempts >= MAX_ATTEMPTS) {
          setTimedOut(true)
          if (pollRef.current) clearInterval(pollRef.current)
        }
      }
    }

    check()
    pollRef.current = setInterval(check, 2000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [orderId])

  const courseItems = items.filter((i) => i.product_type === "course")
  const moldItems = items.filter((i) => i.product_type === "mold")
  const hasCourse = courseItems.length > 0
  const hasMold = moldItems.length > 0

  return (
    <div className="flex flex-col items-center text-center">
      <CheckCircle size={72} className="text-emerald-500 mb-6" strokeWidth={1.5} />
      <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">Payment Successful</h1>
      <p className="text-zinc-500 text-sm mb-1">Your order is confirmed.</p>
      {amount && <p className="text-zinc-400 text-xs mb-8">Amount paid: {amount} EGP</p>}
      {!amount && <div className="mb-8" />}

      {/* Order confirming indicator */}
      {!confirmed && !timedOut && (
        <div className="flex items-center gap-2 text-zinc-400 text-sm mb-6">
          <Loader2 size={14} className="animate-spin" />
          Confirming your order…
        </div>
      )}

      {/* Timeout — webhook hasn't fired yet; order will be confirmed shortly */}
      {timedOut && !confirmed && (
        <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm mb-6 max-w-xs text-left">
          <Clock size={15} className="shrink-0 mt-0.5" />
          <span>
            Your payment was received. Access will be granted within a minute — check{" "}
            <Link href="/my-courses" className="underline font-medium">My Courses</Link> or{" "}
            <Link href="/purchases" className="underline font-medium">Purchases</Link> shortly.
          </span>
        </div>
      )}

      {/* Course items — one "Start Course" button per course */}
      {hasCourse && confirmed && (
        <div className="w-full max-w-xs space-y-3 mb-4">
          {courseItems.map((item) => (
            <div key={item.id} className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <BookOpen size={14} className="text-zinc-400" />
                <span className="font-medium truncate max-w-55">{item.title}</span>
              </div>
              <Link
                href={`/courses/${item.product_id}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors"
              >
                Start Course
              </Link>
            </div>
          ))}
        </div>
      )}

      {(confirmed || timedOut) && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {hasMold && (
            <Link
              href="/purchases"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors"
            >
              <Download size={15} />
              Download Purchases
            </Link>
          )}

          {hasCourse && (
            <Link
              href="/my-courses"
              className="inline-flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-sm px-8 py-3 rounded-xl transition-colors"
            >
              <BookOpen size={15} />
              My Courses
            </Link>
          )}

          <Link
            href="/purchases"
            className="inline-flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 text-zinc-500 text-sm px-8 py-2.5 rounded-xl transition-colors"
          >
            View All Purchases
          </Link>
        </div>
      )}
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
