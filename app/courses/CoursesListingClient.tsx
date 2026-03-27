"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, ChevronLeft, ChevronRight, BookOpen } from "lucide-react"
import { useCoursesListing } from "@/hooks/queries/useCourses"
import type { CoursePriceFilter } from "@/services/course.service"
import type { Course } from "@/types"

const PAGE_SIZE = 12
const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

const PRICE_FILTERS: { label: string; value: CoursePriceFilter }[] = [
  { label: "All",  value: "all" },
  { label: "Free", value: "free" },
  { label: "Paid", value: "paid" },
]

// ── Skeleton card ─────────────────────────────────────────────
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

// ── Course card ───────────────────────────────────────────────
function CourseCard({ course }: { course: Course }) {
  const imgSrc = course.thumbnail_url ? `${R2_BASE}/${course.thumbnail_url}` : null
  const isFree = course.price === null || course.price === 0

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group rounded-xl overflow-hidden border border-zinc-100 bg-white shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col"
    >
      {/* Thumbnail */}
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

        {/* Free badge */}
        {isFree && (
          <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">
            Free
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col gap-1.5">
        <h3 className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
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

// ── Pill button ───────────────────────────────────────────────
function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
        active
          ? "bg-primary text-white border-primary"
          : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
      }`}
    >
      {children}
    </button>
  )
}

// ── Pagination ────────────────────────────────────────────────
function Pagination({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const pages: (number | "…")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push("…")
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push("…")
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-zinc-400 text-sm select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`min-w-[36px] h-9 rounded-lg border text-sm font-medium transition-colors ${
              p === currentPage
                ? "bg-primary text-white border-primary"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function CoursesListingClient() {
  const [inputValue, setInputValue]     = useState("")
  const [searchTerm, setSearchTerm]     = useState("")
  const [priceFilter, setPriceFilter]   = useState<CoursePriceFilter>("all")
  const [currentPage, setCurrentPage]   = useState(1)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(inputValue)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [inputValue])

  const handlePriceFilter = useCallback((value: CoursePriceFilter) => {
    setPriceFilter(value)
    setCurrentPage(1)
  }, [])

  const clearAll = useCallback(() => {
    setInputValue("")
    setSearchTerm("")
    setPriceFilter("all")
    setCurrentPage(1)
  }, [])

  const { data, isLoading, isFetching } = useCoursesListing({
    search: searchTerm,
    priceFilter,
    page: currentPage,
    pageSize: PAGE_SIZE,
  })

  const courses    = data?.data ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const hasActiveFilters = !!searchTerm || priceFilter !== "all"

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">
          Academy
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Professional mold &amp; die industry courses
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search courses…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>

        {/* Price filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Price
          </span>
          {PRICE_FILTERS.map((f) => (
            <PillButton
              key={f.value}
              active={priceFilter === f.value}
              onClick={() => handlePriceFilter(f.value)}
            >
              {f.label}
            </PillButton>
          ))}
        </div>
      </div>

      {/* ── Results meta ── */}
      {!isLoading && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            {total === 0
              ? "No results"
              : `${total} course${total !== 1 ? "s" : ""} found`}
            {isFetching && !isLoading && (
              <span className="ml-2 text-zinc-300">Updating…</span>
            )}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen size={48} className="text-zinc-200 mb-4" strokeWidth={1} />
          <p className="text-zinc-500 font-medium">No courses found</p>
          <p className="text-zinc-400 text-sm mt-1">Try adjusting your search or filters</p>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="mt-4 text-sm text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${
            isFetching && !isLoading ? "opacity-60" : "opacity-100"
          }`}
        >
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!isLoading && totalPages > 1 && (
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
