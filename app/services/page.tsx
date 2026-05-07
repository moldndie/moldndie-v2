import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import ServicesContent from "./ServicesContent"
import { getActiveServices } from "@/services/service.service"

export const metadata: Metadata = {
  title: "Services | MoldNdie",
  description: "Turnkey project management and engineering services for the mold and die industry. Currently available in Egypt only.",
}

export default async function ServicesPage() {
  const services = await getActiveServices()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <ServicesContent services={services} />
      </main>
      <Footer />
    </div>
  )
}
