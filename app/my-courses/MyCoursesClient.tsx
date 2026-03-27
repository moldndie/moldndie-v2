"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { BookOpen, GraduationCap, Play, AlertCircle } from "lucide-react"
import type { MyCourse } from "@/app/api/courses/my/route"

const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-zinc-100 overflow-hidden bg-white shadow-sm">
          <div className="aspect-video bg-zinc-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-zinc-200 rounded w-3/4" />
            <div className="h-9 bg-zinc-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-6">
      <div className="w-20 h-20 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-5">
        <GraduationCap size={32} className="text-zinc-300" strokeWidth={1.5} />
      </div>
      <p className="text-zinc-900 font-bold text-lg">No courses yet</p>
      <p className="text-zinc-400 text-sm mt-1.5 max-w-xs">
        Courses you purchase or free courses will appear here.
      </p>
      <Link
        href="/courses"
        className="mt-6 inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
      >
        Browse Academy
      </Link>
    </div>
  )
}

// ── Course card ───────────────────────────────────────────────────────────────
function CourseCard({ course }: { course: MyCourse }) {
  const thumbnailSrc = course.thumbnail_url ? `${R2_BASE}/${course.thumbnail_url}` : null

  return (
    <div className="rounded-2xl border border-zinc-100 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="aspect-video relative bg-zinc-50">
        {thumbnailSrc ? (
          <Image
            src={thumbnailSrc}
            alt={course.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={40} className="text-zinc-200" strokeWidth={1} />
          </div>
        )}
        {/* Free badge */}
        {(course.price === null || course.price === 0) && (
          <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Free
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <p className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-snug">
          {course.title}
        </p>
        <Link
          href={`/courses/${course.id}`}
          className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
        >
          <Play size={14} />
          Continue Course
        </Link>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MyCoursesClient() {
  const [courses, setCourses] = useState<MyCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/courses/my")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setFetchError(data.error)
        else setCourses(data.courses ?? [])
      })
      .catch(() => setFetchError("Failed to load courses."))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="h-8 w-44 bg-zinc-200 rounded-lg mb-8 animate-pulse" />
        <SkeletonGrid />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-6">
        <AlertCircle size={48} className="text-red-300 mb-4" strokeWidth={1} />
        <p className="text-zinc-700 font-semibold">{fetchError}</p>
      </div>
    )
  }

  if (courses.length === 0) return <EmptyState />

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-extrabold text-zinc-900 mb-8">My Courses</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  )
}
