import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import MyCoursesClient from "./MyCoursesClient"
import { requireModule } from "@/services/siteSettings.service"

export const metadata: Metadata = {
  title: "My Courses | MoldNdie",
  description: "Your purchased and free courses.",
}

export default async function MyCoursesPage() {
  await requireModule("courses")
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <MyCoursesClient />
      </main>
      <Footer />
    </div>
  )
}
