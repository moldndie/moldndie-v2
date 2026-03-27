import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import CourseDetailClient from "./CourseDetailClient"

export const metadata: Metadata = {
  title: "Course | MoldNdie",
  description: "View course details and lessons.",
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <CourseDetailClient courseId={id} />
      </main>
      <Footer />
    </div>
  )
}
