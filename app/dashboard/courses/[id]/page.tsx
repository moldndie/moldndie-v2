import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Metadata } from "next"
import { getCourseByIdAdmin } from "@/services/course.service"
import PageHeader from "@/components/dashboard/PageHeader"
import { LessonsManager } from "@/components/dashboard/courses/LessonsManager"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const course = await getCourseByIdAdmin(id)
    return { title: `${course.title} — Lessons | Admin` }
  } catch {
    return { title: "Course | Admin" }
  }
}

export default async function CourseEditPage({ params }: Props) {
  const { id } = await params

  let course
  try {
    course = await getCourseByIdAdmin(id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back link */}
      <Link
        href="/dashboard/courses"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to Courses
      </Link>

      <PageHeader
        title={course.title}
        description={course.description ?? undefined}
      />

      {/* Course meta strip */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-medium ${
          course.is_published
            ? "bg-green-50 text-green-700"
            : "bg-zinc-100 text-zinc-500"
        }`}>
          {course.is_published ? "Published" : "Draft"}
        </span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">
          {course.price === null || course.price === 0 ? "Free" : `${course.price} EGP`}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-200" />

      {/* Lessons section */}
      <LessonsManager courseId={id} />
    </div>
  )
}
