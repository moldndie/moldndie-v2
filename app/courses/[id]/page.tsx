import type { Metadata } from "next"
import { Suspense } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import CourseDetailClient from "./CourseDetailClient"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"
import { ContentViewTracker } from "@/components/analytics/ContentViewTracker"
import { getContentViewCount } from "@/services/contentViews.service"

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
  const viewCount = await getContentViewCount("course", id)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <ContentViewTracker contentType="course" contentId={id} />
        <CourseDetailClient courseId={id} viewCount={viewCount} />
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <hr className="border-zinc-100 mb-8" />
          <Suspense fallback={null}>
            <AdSlotGrid page="academy" className="w-full" />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
