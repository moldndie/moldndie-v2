"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, ChevronLeft, ChevronRight, Package, ArrowUpDown, Tag } from "lucide-react"
import { useMoldsListing, useMoldCategories } from "@/hooks/queries/useMolds"
import type { PriceFilter, SortOption } from "@/hooks/queries/useMolds"

const PAGE_SIZE = 12
const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

const PRICE_FILTERS: { label: string; value: PriceFilter }[] = [
  { label: "All",  value: "all" },
  { label: "Free", value: "free" },
  { label: "Paid", value: "paid" },
]

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Newest",          value: "newest" },
  { label: "Oldest",          value: "oldest" },
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Price: High → Low", value: "price_desc" },
  { label: "A → Z",           value: "title_asc" },
]

// ── Skeleton card ────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-100 bg-white animate-pulse">
      <div className="aspect-square bg-zinc-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-zinc-200 rounded w-3/4" />
        <div className="h-3 bg-zinc-100 rounded w-1/3" />
      </div>
    </div>
  )
}

// ── Mold card ────────────────────────────────────────────────
function MoldCard({
  mold,
}: {
  mold: {
    id: string
    title: string
    price: number | null
    preview_image: string | null
    category?: { name: string } | null
  }
}) {
  const isFree = mold.price === 0
  const hasPaid = mold.price !== null && mold.price > 0
  const imgSrc = mold.preview_image ? `${R2_BASE}/${mold.preview_image}` : null

  return (
    <Link
      href={`/molds/${mold.id}`}
      className="group rounded-xl overflow-hidden border border-zinc-100 bg-white shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col"
    >
      <div className="aspect-square relative bg-zinc-50 overflow-hidden">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={mold.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={40} className="text-zinc-300" strokeWidth={1} />
          </div>
        )}
        {isFree && (
          <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">
            Free
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {mold.title}
        </h3>
        {mold.category && (
          <p className="text-xs text-zinc-400">{mold.category.name}</p>
        )}
        <div className="mt-auto pt-2">
          {isFree ? (
            <span className="text-sm font-bold text-emerald-600">Free</span>
          ) : hasPaid ? (
            <span className="text-sm font-bold text-zinc-900">${mold.price}</span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

// ── Pill button ──────────────────────────────────────────────
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

// ── Pagination ───────────────────────────────────────────────
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

// ── Main component ───────────────────────────────────────────
export default function MoldsListingClient() {
  const [inputValue, setInputValue]         = useState("")
  const [searchTerm, setSearchTerm]         = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [priceFilter, setPriceFilter]       = useState<PriceFilter>("all")
  const [sort, setSort]                     = useState<SortOption>("newest")
  const [currentPage, setCurrentPage]       = useState(1)

  // Debounce search → reset page
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(inputValue)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [inputValue])

  const handleCategoryChange = useCallback((id: string | null) => {
    setSelectedCategory(id)
    setCurrentPage(1)
  }, [])

  const handlePriceFilter = useCallback((value: PriceFilter) => {
    setPriceFilter(value)
    setCurrentPage(1)
  }, [])

  const handleSort = useCallback((value: SortOption) => {
    setSort(value)
    setCurrentPage(1)
  }, [])

  const clearAll = useCallback(() => {
    setInputValue("")
    setSearchTerm("")
    setSelectedCategory(null)
    setPriceFilter("all")
    setSort("newest")
    setCurrentPage(1)
  }, [])

  const { data, isLoading, isFetching } = useMoldsListing({
    search: searchTerm,
    categoryId: selectedCategory,
    priceFilter,
    sort,
    page: currentPage,
    pageSize: PAGE_SIZE,
  })

  const { data: categories } = useMoldCategories()

  const molds      = data?.data ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const hasActiveFilters =
    !!searchTerm || !!selectedCategory || priceFilter !== "all" || sort !== "newest"

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">
          Mold Library
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Browse and download professional mold & die designs
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div className="space-y-4">
        {/* Row 1: Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search molds…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <ArrowUpDown
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
            <select
              value={sort}
              onChange={(e) => handleSort(e.target.value as SortOption)}
              className="pl-8 pr-8 py-2.5 text-sm border border-zinc-200 rounded-lg bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none cursor-pointer transition-colors"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronLeft
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none -rotate-90"
            />
          </div>
        </div>

        {/* Row 2: Category dropdown + Price filter */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Category dropdown */}
          <div className="relative">
            <Tag
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
            <select
              value={selectedCategory ?? ""}
              onChange={(e) => handleCategoryChange(e.target.value || null)}
              className="pl-8 pr-8 py-2.5 text-sm border border-zinc-200 rounded-lg bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none cursor-pointer transition-colors"
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronLeft
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none -rotate-90"
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
      </div>

      {/* ── Results meta ── */}
      {!isLoading && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            {total === 0
              ? "No results"
              : `${total} mold${total !== 1 ? "s" : ""} found`}
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : molds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package size={48} className="text-zinc-200 mb-4" strokeWidth={1} />
          <p className="text-zinc-500 font-medium">No molds found</p>
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
          className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 transition-opacity duration-200 ${
            isFetching && !isLoading ? "opacity-60" : "opacity-100"
          }`}
        >
          {molds.map((mold) => (
            <MoldCard key={mold.id} mold={mold} />
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
