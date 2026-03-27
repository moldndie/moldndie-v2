"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle } from "lucide-react"

function PaymentResultContent() {
  const searchParams = useSearchParams()

  const isSuccess = searchParams.get("success") === "true"
  const amountCents = searchParams.get("amount_cents")
  const amount = amountCents ? (Number(amountCents) / 100).toFixed(2) : null

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center text-center">
        <CheckCircle size={72} className="text-emerald-500 mb-6" strokeWidth={1.5} />
        <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">Payment Successful</h1>
        <p className="text-zinc-500 text-sm mb-1">Your order is confirmed.</p>
        {amount && (
          <p className="text-zinc-400 text-xs mb-8">Amount paid: ${amount}</p>
        )}
        {!amount && <div className="mb-8" />}
        <Link
          href="/molds"
          className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors"
        >
          Go to Library
        </Link>
      </div>
    )
  }

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

export default function PaymentResultPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20 bg-white">
      <Suspense>
        <PaymentResultContent />
      </Suspense>
    </div>
  )
}
