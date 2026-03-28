"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { BookOpen } from "lucide-react"
import { ListingFiltersBar } from "@/components/listing/ListingFiltersBar"
import { Pagination } from "@/components/listing/Pagination"
import { useCoursesListing } from "@/hooks/queries/useCourses"
import type { CourseSort } from "@/hooks/queries/useCourses"
import type { CoursePriceFilter } from "@/services/course.service"
import type { Course } from "@/types"

const PAGE_SIZE = 12
const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

const SORT_OPTIONS: { label: string; value: CourseSort }[] = [
  { label: "Newest",            value: "newest" },
  { label: "Oldest",            value: "oldest" },
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Price: High → Low", value: "price_desc" },
  { label: "A → Z",             value: "title_asc" },
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

function CourseCard({ course }: { course: Course }) {
  const imgSrc = course.thumbnail_url ? `${R2_BASE}/${course.thumbnail_url}` : null
  const isFree = course.price === null || course.price === 0

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group rounded-xl overflow-hidden border border-zinc-100 bg-white shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col"
    >
      <div className="aspect-video relative bg-zinc-50 overflow-hidden">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
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
        <div className="mt-auto pt-2">
          {isFree ? (
            <span className="text-sm font-bold text-emerald-600">Free</span>
          ) : (
            <span className="text-sm font-bold text-zinc-900">${course.price}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function CoursesListingClient() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const [inputValue, setInputValue]   = useState(() => searchParams.get("search") ?? "")
  const [searchTerm, setSearchTerm]   = useState(() => searchParams.get("search") ?? "")
  const [priceFilter, setPriceFilter] = useState<CoursePriceFilter>(() => (searchParams.get("price") as CoursePriceFilter) ?? "all")
  const [sort, setSort]               = useState<CourseSort>(() => (searchParams.get("sort") as CourseSort) ?? "newest")
  const [currentPage, setCurrentPage] = useState(() => Number(searchParams.get("page")) || 1)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearchTerm(inputValue); setCurrentPage(1) }, 300)
    return () => clearTimeout(t)
  }, [inputValue])

  // Sync to URL
  useEffect(() => {
    const p = new URLSearchParams()
    if (searchTerm)            p.set("search", searchTerm)
    if (priceFilter !== "all") p.set("price",  priceFilter)
    if (sort !== "newest")     p.set("sort",   sort)
    if (currentPage > 1)       p.set("page",   String(currentPage))
    const qs = p.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [searchTerm, priceFilter, sort, currentPage, pathname, router])

  const handlePriceFilter = useCallback((v: CoursePriceFilter) => { setPriceFilter(v); setCurrentPage(1) }, [])
  const handleSort        = useCallback((v: string) => { setSort(v as CourseSort); setCurrentPage(1) }, [])
  const clearAll          = useCallback(() => {
    setInputValue(""); setSearchTerm(""); setPriceFilter("all"); setSort("newest"); setCurrentPage(1)
  }, [])

  const { data, isLoading, isFetching } = useCoursesListing({
    search: searchTerm,
    priceFilter,
    sort,
    page: currentPage,
    pageSize: PAGE_SIZE,
  })

  const courses    = data?.data ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasActiveFilters = !!searchTerm || priceFilter !== "all" || sort !== "newest"

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">Academy</h1>
        <p className="mt-1 text-sm text-zinc-500">Professional mold &amp; die industry courses</p>
      </div>

      <ListingFiltersBar
        searchValue={inputValue}
        onSearchChange={setInputValue}
        searchPlaceholder="Search courses…"
        sortValue={sort}
        onSortChange={handleSort}
        sortOptions={SORT_OPTIONS}
        priceValue={priceFilter}
        onPriceChange={handlePriceFilter}
        hasActiveFilters={hasActiveFilters}
        onClear={clearAll}
        isFetching={isFetching && !isLoading}
      />

      {!isLoading && (
        <p className="text-xs text-zinc-400">
          {total === 0 ? "No results" : `${total} course${total !== 1 ? "s" : ""} found`}
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen size={48} className="text-zinc-200 mb-4" strokeWidth={1} />
          <p className="text-zinc-500 font-medium">No courses found</p>
          <p className="text-zinc-400 text-sm mt-1">Try adjusting your search or filters</p>
          {hasActiveFilters && (
            <button onClick={clearAll} className="mt-4 text-sm text-primary underline underline-offset-2 hover:opacity-70">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${isFetching && !isLoading ? "opacity-60" : ""}`}>
          {courses.map((course) => <CourseCard key={course.id} course={course} />)}
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="pt-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
        </div>
      )}
    </div>
  )
}
