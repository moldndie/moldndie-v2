import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import MoldsListingClient from "./MoldsListingClient"

export const metadata: Metadata = {
  title: "Mold Library | MoldNdie",
  description:
    "Browse and download professional plastic injection mold, die-casting mold, and sheet metal die designs.",
}

export default function MoldsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <MoldsListingClient />
      </main>
      <Footer />
    </div>
  )
}
