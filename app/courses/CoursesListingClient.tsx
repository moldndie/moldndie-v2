"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { BookOpen, Eye } from "lucide-react"
import { ListingFiltersBar } from "@/components/listing/ListingFiltersBar"
import { Pagination } from "@/components/listing/Pagination"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import { useCoursesListing, useAcademyCategories } from "@/hooks/queries/useCourses"
import { useContentViewCounts } from "@/hooks/queries/useContentViews"
import type { CourseSort, CoursesListingParams } from "@/hooks/queries/useCourses"
import type { TraineeLevel } from "@/services/course.service"
import type { Course } from "@/types"
import { useCurrency } from "@/context/CurrencyContext"
import { displayPrice } from "@/lib/currency"
import { docToText } from "@/lib/richtext"

const DEFAULT_PAGE_SIZE = 6
const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

const SORT_OPTIONS: { label: string; value: CourseSort }[] = [
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Price: High → Low", value: "price_desc" },
  { label: "A → Z",             value: "title_asc" },
]

const TRAINEE_LEVELS: { label: string; value: TraineeLevel | "" }[] = [
  { label: "Beginner",     value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Expert",       value: "expert" },
]

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-100 bg-white animate-pulse">
      <div className="aspect-video bg-zinc-200" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 bg-zinc-200 rounded w-3/4" />
        <div className="h-3 bg-zinc-100 rounded w-full" />
        <div className="h-3 bg-zinc-100 rounded w-2/3" />
        <div className="h-4 bg-zinc-200 rounded w-1/4 mt-2" />
      </div>
    </div>
  )
}

function CourseCard({ course, views }: { course: Course; views: number }) {
  const { currency, rates } = useCurrency()
  const { text: priceText, isFree } = displayPrice(course.price, "EGP", currency, rates)
  const imgSrc = course.thumbnail_url ? `${R2_BASE}/${course.thumbnail_url}` : null

  const levelColors: Record<string, string> = {
    beginner:     "bg-emerald-100 text-emerald-700",
    intermediate: "bg-blue-100 text-blue-700",
    expert:       "bg-amber-100 text-amber-700",
  }

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group rounded-xl overflow-hidden border border-zinc-100 bg-white shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col"
    >
      <div className="aspect-video relative bg-white overflow-hidden">
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
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{docToText(course.description)}</p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <span className={`text-sm font-bold ${isFree ? "text-emerald-600" : "text-zinc-900"}`}>
            {priceText}
          </span>
          <div className="flex items-center gap-2">
            {views > 0 && (
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <Eye className="size-3" />
                {views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views}
              </span>
            )}
            {course.trainee_level && (
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${levelColors[course.trainee_level] ?? "bg-zinc-100 text-zinc-600"}`}>
                {course.trainee_level}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function CoursesListingClient() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const [inputValue, setInputValue]         = useState(() => searchParams.get("search") ?? "")
  const [searchTerm, setSearchTerm]         = useState(() => searchParams.get("search") ?? "")
  const [sort, setSort]                     = useState<CourseSort>(() => (searchParams.get("sort") as CourseSort) ?? "price_asc")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => searchParams.get("category"))
  const [traineeLevel, setTraineeLevel]     = useState<TraineeLevel | "">(() => (searchParams.get("level") as TraineeLevel) ?? "")
  const [currentPage, setCurrentPage]       = useState(() => Number(searchParams.get("page")) || 1)
  const pageSize = DEFAULT_PAGE_SIZE

  useEffect(() => {
    const t = setTimeout(() => { setSearchTerm(inputValue); setCurrentPage(1) }, 300)
    return () => clearTimeout(t)
  }, [inputValue])

  useEffect(() => {
    const p = new URLSearchParams()
    if (searchTerm)                       p.set("search",   searchTerm)
    if (sort !== "price_asc")             p.set("sort",     sort)
    if (selectedCategory)                 p.set("category", selectedCategory)
    if (traineeLevel)                     p.set("level",    traineeLevel)
    if (currentPage > 1)                  p.set("page",     String(currentPage))
    const qs = p.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [searchTerm, sort, selectedCategory, traineeLevel, currentPage, pathname, router])

  const handleSort           = useCallback((v: string) => { setSort(v as CourseSort); setCurrentPage(1) }, [])
  const handleCategoryChange = useCallback((id: string | null) => { setSelectedCategory(id); setCurrentPage(1) }, [])
  const handleTraineeLevel   = useCallback((v: string) => { setTraineeLevel(v as TraineeLevel | ""); setCurrentPage(1) }, [])
  const clearAll             = useCallback(() => {
    setInputValue(""); setSearchTerm(""); setSort("price_asc")
    setSelectedCategory(null); setTraineeLevel(""); setCurrentPage(1)
  }, [])

  const params: CoursesListingParams = {
    search: searchTerm,
    sort,
    categoryId: selectedCategory,
    traineeLevel: traineeLevel || undefined,
    page: currentPage,
    pageSize,
  }

  const { data, isLoading, isFetching } = useCoursesListing(params)
  const { data: allCategories = [] } = useAcademyCategories()
  const categories = allCategories.filter((c) => c.is_active)

  const courses    = data?.data ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)
  const hasActiveFilters = !!searchTerm || sort !== "price_asc" || !!selectedCategory || !!traineeLevel

  const { data: viewsMap } = useContentViewCounts("course", courses.map((c) => c.id))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <PublicBreadcrumb crumbs={[{ label: "Academy" }]} />
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">Academy</h1>
        <p className="mt-1 text-sm text-zinc-500">Professional mold &amp; die industry courses</p>
      </div>

      <ListingFiltersBar
        searchValue={inputValue}
        onSearchChange={setInputValue}
        searchPlaceholder="Search courses…"
        sortValue={sort}
        onSortChange={handleSort}
        sortOptions={SORT_OPTIONS}
        categories={categories.length > 0 ? categories : undefined}
        categoryValue={selectedCategory ?? ""}
        onCategoryChange={categories.length > 0 ? handleCategoryChange : undefined}
        categoryPlaceholder="All categories"
        hasActiveFilters={hasActiveFilters}
        onClear={clearAll}
        isFetching={isFetching && !isLoading}
      />

      {/* Trainee level filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-500 shrink-0">Level:</span>
        <div className="flex flex-wrap gap-1">
          {TRAINEE_LEVELS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleTraineeLevel(traineeLevel === opt.value ? "" : opt.value)}
              className={`h-8 px-3 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                traineeLevel === opt.value
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {!isLoading && (
        <p className="text-xs text-zinc-400">
          {total === 0 ? "No results" : `${total} course${total !== 1 ? "s" : ""} found`}
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: pageSize }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen size={48} className="text-zinc-200 mb-4" strokeWidth={1} />
          <p className="text-zinc-500 font-medium">No courses found</p>
          <p className="text-zinc-400 text-sm mt-1">Try adjusting your search or filters</p>
          {hasActiveFilters && (
            <button onClick={clearAll} className="mt-4 text-sm text-primary no-underline underline-offset-2 hover:underline hover:opacity-70">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${isFetching && !isLoading ? "opacity-60" : ""}`}>
          {courses.map((course) => <CourseCard key={course.id} course={course} views={viewsMap?.get(course.id) ?? 0} />)}
        </div>
      )}

      {!isLoading && (
        <div className="pt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  )
}
