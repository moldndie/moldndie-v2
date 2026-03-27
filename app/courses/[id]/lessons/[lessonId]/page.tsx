import type { Metadata } from "next"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import LessonViewerClient from "./LessonViewerClient"

export const metadata: Metadata = {
  title: "Lesson | MoldNdie",
  description: "Watch lesson and learn.",
}

export default async function LessonViewerPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>
}) {
  const { id, lessonId } = await params

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <LessonViewerClient courseId={id} lessonId={lessonId} />
      </main>
      <Footer />
    </div>
  )
}
