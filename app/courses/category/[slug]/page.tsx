import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import { Pagination } from "@/components/listing/Pagination"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"
import { PriceTag } from "@/components/pricing/PriceTag"
import { getAcademyCategoryBySlug } from "@/services/academyCategory.service"
import { getCoursesListing } from "@/services/course.service"
import type { Course } from "@/types"

const PAGE_SIZE = 12
const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = await getAcademyCategoryBySlug(slug).catch(() => null)
  if (!category) return { title: "Academy | MoldNdie" }
  return {
    title: `${category.name} | Academy | MoldNdie`,
    description: `Browse ${category.name} courses in the MoldNdie Academy.`,
  }
}

function CourseCard({ course }: { course: Course }) {
  const imgSrc = course.thumbnail_url ? `${R2_BASE}/${course.thumbnail_url}` : null
  const isFree = course.price === null || course.price === 0

  const levelColors: Record<string, string> = {
    beginner:     "bg-emerald-100 text-emerald-700",
    intermediate: "bg-blue-100 text-blue-700",
    expert:       "bg-amber-100 text-amber-700",
  }

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group rounded-xl overflow-hidden border border-zinc-100 bg-white shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col h-full"
    >
      <div className="aspect-video relative bg-zinc-50 overflow-hidden">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={course.title}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={36} className="text-zinc-300" strokeWidth={1} />
          </div>
        )}
        {isFree && (
          <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">
            Free
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col gap-1.5">
        <h3 className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{course.description}</p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <PriceTag amount={course.price} />
          {course.trainee_level && (
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${levelColors[course.trainee_level] ?? "bg-zinc-100 text-zinc-600"}`}>
              {course.trainee_level}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-zinc-100 bg-white animate-pulse">
          <div className="aspect-video bg-zinc-200" />
          <div className="p-4 space-y-2.5">
            <div className="h-4 bg-zinc-200 rounded w-3/4" />
            <div className="h-3 bg-zinc-100 rounded w-full" />
            <div className="h-4 bg-zinc-200 rounded w-1/4 mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function AcademyCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const category = await getAcademyCategoryBySlug(slug).catch(() => null)
  if (!category) notFound()

  const { data: courses, total } = await getCoursesListing({
    categoryId: category.id,
    page,
    pageSize: PAGE_SIZE,
  }).catch(() => ({ data: [], total: 0 }))

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function buildPageHref(p: number) {
    return p === 1
      ? `/courses/category/${slug}`
      : `/courses/category/${slug}?page=${p}`
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          {/* Header */}
          <div>
            <PublicBreadcrumb
              crumbs={[
                { label: "Academy", href: "/courses" },
                { label: category.name },
              ]}
            />
            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">
              {category.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {total === 0
                ? "No courses in this category yet."
                : `${total} course${total !== 1 ? "s" : ""} in this category`}
            </p>
          </div>

          {/* Grid */}
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <BookOpen size={48} className="text-zinc-200 mb-4" strokeWidth={1} />
              <p className="text-zinc-500 font-medium">No courses found</p>
              <p className="text-zinc-400 text-sm mt-1">Check back later for new content.</p>
              <Link href="/courses" className="mt-4 text-sm text-primary underline underline-offset-2 hover:opacity-70">
                Browse all courses
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-4">
              <div className="flex items-center justify-center gap-1 flex-wrap">
                {page > 1 && (
                  <Link
                    href={buildPageHref(page - 1)}
                    className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 border border-zinc-200 hover:border-zinc-400 transition-colors"
                  >
                    Previous
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={buildPageHref(p)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-primary text-white"
                        : "text-zinc-600 border border-zinc-200 hover:border-zinc-400"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
                {page < totalPages && (
                  <Link
                    href={buildPageHref(page + 1)}
                    className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 border border-zinc-200 hover:border-zinc-400 transition-colors"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Ads */}
          <div>
            <hr className="border-zinc-100 mb-8" />
            <Suspense fallback={null}>
              <AdSlotGrid page="academy" className="w-full" />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
