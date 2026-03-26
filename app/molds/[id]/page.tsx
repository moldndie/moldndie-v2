import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import MoldProductClient from "./MoldProductClient"

export const metadata: Metadata = {
  title: "Mold Details | MoldNdie",
  description: "View mold details, gallery, and download or purchase this design.",
}

export default async function MoldProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <MoldProductClient moldId={id} />
      </main>
      <Footer />
    </div>
  )
}
