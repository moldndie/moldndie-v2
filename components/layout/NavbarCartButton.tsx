"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/hooks/queries/useCart"

export default function NavbarCartButton() {
  const { data: items = [] } = useCart()
  const count = items.length

  return (
    <Link
      href="/cart"
      className="relative p-2 text-zinc-600 hover:text-zinc-900 transition-colors"
      aria-label="Cart"
    >
      <ShoppingCart size={20} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 flex items-center justify-center bg-primary text-white text-[10px] font-bold rounded-full px-1 leading-none">
          {count}
        </span>
      )}
    </Link>
  )
}
