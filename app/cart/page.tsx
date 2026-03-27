import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import CartClient from "./CartClient"

export const metadata: Metadata = {
  title: "Cart | MoldNdie",
  description: "Review and checkout your selected molds and courses.",
}

export default function CartPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <CartClient />
      </main>
      <Footer />
    </div>
  )
}
