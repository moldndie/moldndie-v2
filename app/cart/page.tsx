import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import CartClient from "./CartClient"
import { getDisabledModules } from "@/services/siteSettings.service"

export const metadata: Metadata = {
  title: "Cart | MoldNdie",
  description: "Review and checkout your selected molds and courses.",
}

export default async function CartPage() {
  const disabled = await getDisabledModules()
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <CartClient showLibrary={!disabled.includes("molds")} showAcademy={!disabled.includes("courses")} />
      </main>
      <Footer />
    </div>
  )
}
