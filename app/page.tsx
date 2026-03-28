import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import HomeClient from "./HomeClient"

export const metadata: Metadata = {
  title: "MoldNdie — Mold & Die Design Resources",
  description:
    "The ultimate resource for plastic injection mold, metal die-casting mold, and sheet metal die design and manufacture know-how.",
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <HomeClient />
      <Footer />
    </div>
  )
}
