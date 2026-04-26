import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import HomeClient from "./HomeClient"
import { getSiteSettings } from "@/services/siteSettings.service"

export const metadata: Metadata = {
  title: "MoldNdie — Mold & Die Design Resources",
  description:
    "The ultimate resource for plastic injection mold, metal die-casting mold, and sheet metal die design and manufacture know-how.",
}

export default async function HomePage() {
  let counters: { toolings?: string; courses?: string; users?: string; events?: string } = {}
  try {
    const settings = await getSiteSettings()
    counters = {
      toolings: settings.counter_toolings,
      courses:  settings.counter_courses,
      users:    settings.counter_users,
      events:   settings.counter_events,
    }
  } catch {
    // gracefully degrade if site_settings table doesn't exist yet
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <HomeClient counters={counters} />
      <Footer />
    </div>
  )
}
