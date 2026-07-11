"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Package, Eye } from "lucide-react"
import { ListingFiltersBar } from "@/components/listing/ListingFiltersBar"
import { Pagination } from "@/components/listing/Pagination"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import { useMoldsListing, useMoldCategories } from "@/hooks/queries/useMolds"
import { useContentViewCounts } from "@/hooks/queries/useContentViews"
import type { SortOption } from "@/hooks/queries/useMolds"
import { useCurrency } from "@/context/CurrencyContext"
import { displayPrice } from "@/lib/currency"

const DEFAULT_PAGE_SIZE = 6
const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Price: Low → High",  value: "price_asc" },
  { label: "Price: High → Low",  value: "price_desc" },
  { label: "A → Z",              value: "title_asc" },
]

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

function MoldCard({ mold, views }: {
  mold: { id: string; title: string; price: number | null; preview_image: string | null; category?: { name: string } | null }
  views: number
}) {
  const { currency, rates } = useCurrency()
  const { text: priceText, isFree } = displayPrice(mold.price, "EGP", currency, rates)
  const imgSrc = mold.preview_image ? `${R2_BASE}/${mold.preview_image}` : null

  return (
    <Link
      href={`/molds/${mold.id}`}
      className="group rounded-xl overflow-hidden border border-zinc-100 bg-white shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col"
    >
      <div className="aspect-square relative bg-white overflow-hidden">
        {imgSrc ? (
          <Image src={imgSrc} alt={mold.title} fill className="object-contain group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={40} className="text-zinc-300" strokeWidth={1} />
          </div>
        )}
        {isFree && (
          <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">Free</span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">{mold.title}</h3>
        {mold.category && <p className="text-xs text-zinc-400">{mold.category.name}</p>}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <span className={`text-sm font-bold ${isFree ? "text-emerald-600" : "text-zinc-900"}`}>
            {priceText}
          </span>
          {views > 0 && (
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <Eye className="size-3" />
              {views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function MoldsListingClient() {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  const [inputValue, setInputValue]         = useState(() => searchParams.get("search") ?? "")
  const [searchTerm, setSearchTerm]         = useState(() => searchParams.get("search") ?? "")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => searchParams.get("category"))
  const [sort, setSort]                     = useState<SortOption>(() => (searchParams.get("sort") as SortOption) ?? "price_asc")
  const [currentPage, setCurrentPage]       = useState(() => Number(searchParams.get("page")) || 1)
  const pageSize = DEFAULT_PAGE_SIZE

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearchTerm(inputValue); setCurrentPage(1) }, 300)
    return () => clearTimeout(t)
  }, [inputValue])

  // Sync to URL
  useEffect(() => {
    const p = new URLSearchParams()
    if (searchTerm)                         p.set("search",   searchTerm)
    if (selectedCategory)                   p.set("category", selectedCategory)
    if (sort !== "price_asc")               p.set("sort",     sort)
    if (currentPage > 1)                    p.set("page",     String(currentPage))
    const qs = p.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [searchTerm, selectedCategory, sort, currentPage, pathname, router])

  const handleCategoryChange = useCallback((id: string | null) => { setSelectedCategory(id); setCurrentPage(1) }, [])
  const handleSort           = useCallback((v: string)         => { setSort(v as SortOption); setCurrentPage(1) }, [])
  const clearAll             = useCallback(() => {
    setInputValue(""); setSearchTerm(""); setSelectedCategory(null)
    setSort("price_asc"); setCurrentPage(1)
  }, [])

  const { data, isLoading, isFetching } = useMoldsListing({ search: searchTerm, categoryId: selectedCategory, sort, page: currentPage, pageSize })
  const { data: categories } = useMoldCategories()

  const molds      = data?.data ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)
  const hasActiveFilters = !!searchTerm || !!selectedCategory || sort !== "price_asc"

  const { data: viewsMap } = useContentViewCounts("mold", molds.map((m) => m.id))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <PublicBreadcrumb crumbs={[{ label: "Library" }]} />
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">Library</h1>
        <p className="mt-1 text-sm text-zinc-500">Browse and download professional mold &amp; die designs</p>
      </div>

      <ListingFiltersBar
        searchValue={inputValue}
        onSearchChange={setInputValue}
        searchPlaceholder="Search molds…"
        sortValue={sort}
        onSortChange={handleSort}
        sortOptions={SORT_OPTIONS}
        categories={categories}
        categoryValue={selectedCategory ?? ""}
        onCategoryChange={handleCategoryChange}
        hasActiveFilters={hasActiveFilters}
        onClear={clearAll}
        isFetching={isFetching && !isLoading}
      />

      {/* Results meta */}
      {!isLoading && (
        <p className="text-xs text-zinc-400">
          {total === 0 ? "No results" : `${total} mold${total !== 1 ? "s" : ""} found`}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: pageSize }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : molds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package size={48} className="text-zinc-200 mb-4" strokeWidth={1} />
          <p className="text-zinc-500 font-medium">No molds found</p>
          <p className="text-zinc-400 text-sm mt-1">Try adjusting your search or filters</p>
          {hasActiveFilters && (
            <button onClick={clearAll} className="mt-4 text-sm text-primary underline underline-offset-2 hover:opacity-70">Clear all filters</button>
          )}
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${isFetching && !isLoading ? "opacity-60" : ""}`}>
          {molds.map((mold) => <MoldCard key={mold.id} mold={mold} views={viewsMap?.get(mold.id) ?? 0} />)}
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
