import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import MyCoursesClient from "./MyCoursesClient"

export const metadata: Metadata = {
  title: "My Courses | MoldNdie",
  description: "Your purchased and free courses.",
}

export default function MyCoursesPage() {
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
