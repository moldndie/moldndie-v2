"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, MapPin, Globe, MapPinned, ChevronDown, Lock } from "lucide-react"
import { ListingFiltersBar } from "@/components/listing/ListingFiltersBar"
import { Pagination } from "@/components/listing/Pagination"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import {
  useSuppliersListing,
  useSupplierCategories,
  useSupplierCountries,
} from "@/hooks/queries/useSuppliers"
import type { SupplierSort } from "@/hooks/queries/useSuppliers"
import { createClient } from "@/lib/supabase/client"

const DEFAULT_PAGE_SIZE = 6
const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

const SORT_OPTIONS: { label: string; value: SupplierSort }[] = [
  { label: "Product or Service A → Z", value: "service_asc" },
  { label: "Company Name A → Z",       value: "name_asc" },
  { label: "Country of Origin A → Z",  value: "country_asc" },
]

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}
const gridVariants = {
  animate: { transition: { staggerChildren: 0.04 } },
}
const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

// ── Login gate overlay ────────────────────────────────────────
function LoginGate({ callbackPath }: { callbackPath: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 rounded-b-xl bg-white/80 backdrop-blur-[3px] px-4 py-4 text-center">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100">
        <Lock size={14} className="text-zinc-500" />
      </div>
      <p className="text-sm font-semibold text-zinc-800">Sign in to view full details</p>
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(callbackPath)}`}
        className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-5 py-1.5 rounded-lg transition-colors"
      >
        Log In
      </Link>
    </div>
  )
}

function SupplierExpandedContent({ supplier }: {
  supplier: { description: string | null; website: string | null; address: string | null }
}) {
  const hasDetails = supplier.description || supplier.website || supplier.address

  return (
    <div className="border-t border-zinc-100 bg-zinc-50/70 px-5 py-4 space-y-4">
      {!hasDetails && (
        <p className="text-sm text-zinc-400 italic">No additional details available.</p>
      )}
      {supplier.description && (
        <p className="text-sm text-zinc-600 leading-relaxed">{supplier.description}</p>
      )}
      {(supplier.website || supplier.address) && (
        <div className="flex flex-col gap-2.5">
          {supplier.website && (
            <a
              href={supplier.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
            >
              <Globe size={13} className="shrink-0" />
              <span className="break-all">{supplier.website.replace(/^https?:\/\//, "")}</span>
            </a>
          )}
          {supplier.address && (
            <div className="flex items-start gap-2 text-sm text-zinc-500">
              <MapPinned size={13} className="mt-0.5 shrink-0" />
              {supplier.address}
            </div>
          )}
        </div>
      )}
      {supplier.website && (
        <a
          href={supplier.website}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
        >
          <Globe size={14} />
          Visit Website
        </a>
      )}
    </div>
  )
}

function SupplierCard({
  supplier,
  expanded,
  onToggle,
  isLoggedIn,
  callbackPath,
}: {
  supplier: {
    id: string
    name: string
    description: string | null
    logo_path: string | null
    country: string | null
    website: string | null
    address: string | null
    sponsored: boolean
    category?: { name: string } | null
  }
  expanded: boolean
  onToggle: () => void
  isLoggedIn: boolean | null
  callbackPath: string
}) {
  const logoSrc = supplier.logo_path ? `${R2_BASE}/${supplier.logo_path}` : null
  const showGate = expanded && isLoggedIn === false

  return (
    <motion.div
      variants={cardVariants}
      className={`rounded-xl overflow-hidden border bg-white shadow-sm transition-colors duration-200 flex flex-col h-full ${
        expanded
          ? "border-primary shadow-md"
          : supplier.sponsored
          ? "border-amber-200 hover:shadow-lg hover:border-amber-300"
          : "border-zinc-100 hover:shadow-lg hover:border-zinc-200"
      }`}
    >
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1 }}
        className="w-full flex-1 p-5 flex flex-col gap-4 text-left"
      >
        {supplier.sponsored && (
          <span className="self-start text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 tracking-wide uppercase">
            Sponsored
          </span>
        )}

        {/* Supplier image — aspect-4/3 matches the 4:3 crop ratio */}
        <div className="w-full aspect-4/3 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-100 relative">
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt={supplier.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 size={36} className="text-zinc-300" strokeWidth={1} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 w-full">
          <h3
            className={`text-base font-bold leading-snug line-clamp-2 transition-colors ${
              expanded ? "text-primary" : "text-zinc-900"
            }`}
          >
            {supplier.name}
          </h3>
          {supplier.category && (
            <span className="text-sm text-primary font-semibold mt-1 block">
              {supplier.category.name}
            </span>
          )}
          {supplier.country && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-2">
              <MapPin size={11} className="shrink-0" />
              {supplier.country}
            </div>
          )}
        </div>

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="self-center"
        >
          <ChevronDown size={15} className="text-zinc-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="relative min-h-25">
              <div className={showGate ? "blur-[3px] pointer-events-none select-none" : ""}>
                <SupplierExpandedContent supplier={supplier} />
              </div>
              {showGate && <LoginGate callbackPath={callbackPath} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-100 bg-white animate-pulse">
      <div className="p-5 flex flex-col gap-4">
        <div className="w-full h-28 bg-zinc-200 rounded-xl" />
        <div className="h-5 bg-zinc-200 rounded w-2/3" />
        <div className="h-3 bg-zinc-100 rounded w-1/3" />
      </div>
    </div>
  )
}

export default function SuppliersListingClient() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const [inputValue, setInputValue]             = useState(() => searchParams.get("search") ?? "")
  const [searchTerm, setSearchTerm]             = useState(() => searchParams.get("search") ?? "")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => searchParams.get("category"))
  const [selectedCountry, setSelectedCountry]   = useState<string | null>(() => searchParams.get("country"))
  const [sort, setSort]                         = useState<SupplierSort>(() => (searchParams.get("sort") as SupplierSort) ?? "service_asc")
  const [currentPage, setCurrentPage]           = useState(() => Number(searchParams.get("page")) || 1)
  const pageSize = DEFAULT_PAGE_SIZE
  const [expandedIds, setExpandedIds]           = useState<Record<string, boolean>>({})
  const [isLoggedIn, setIsLoggedIn]             = useState<boolean | null>(null)

  // Auth check
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearchTerm(inputValue); setCurrentPage(1) }, 300)
    return () => clearTimeout(t)
  }, [inputValue])

  // Sync to URL
  useEffect(() => {
    const p = new URLSearchParams()
    if (searchTerm)      p.set("search",   searchTerm)
    if (selectedCategory) p.set("category", selectedCategory)
    if (selectedCountry)  p.set("country",  selectedCountry)
    if (sort !== "service_asc") p.set("sort", sort)
    if (currentPage > 1) p.set("page",     String(currentPage))
    const qs = p.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [searchTerm, selectedCategory, selectedCountry, sort, currentPage, pathname, router])

  const handleCategoryChange = useCallback((id: string | null) => { setSelectedCategory(id); setCurrentPage(1) }, [])
  const handleSort           = useCallback((v: string) => { setSort(v as SupplierSort); setCurrentPage(1) }, [])
  const clearAll             = useCallback(() => {
    setInputValue(""); setSearchTerm(""); setSelectedCategory(null)
    setSelectedCountry(null); setSort("service_asc"); setCurrentPage(1)
  }, [])

  const { data, isLoading, isFetching } = useSuppliersListing({
    search: searchTerm,
    categoryId: selectedCategory,
    country: selectedCountry,
    sort,
    page: currentPage,
    pageSize,
  })
  const { data: categories } = useSupplierCategories()
  const { data: countryList = [] } = useSupplierCountries()

  const suppliers  = data?.data ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)
  const hasActiveFilters = !!searchTerm || !!selectedCategory || !!selectedCountry || sort !== "service_asc"

  const handleToggle = (id: string) => setExpandedIds((prev) => ({
    ...prev,
    [id]: !prev[id],
  }))

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8"
    >
      <div>
        <PublicBreadcrumb crumbs={[{ label: "Suppliers" }]} />
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">
          Suppliers
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Browse our verified network of mold and die suppliers
        </p>
      </div>

      <div className="space-y-3">
        <ListingFiltersBar
          searchValue={inputValue}
          onSearchChange={setInputValue}
          searchPlaceholder="Search suppliers…"
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

        {/* Country filter */}
        {countryList.length > 0 && (
          <select
            value={selectedCountry ?? ""}
            onChange={(e) => { setSelectedCountry(e.target.value || null); setCurrentPage(1) }}
            className="h-9 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition w-full sm:w-52"
          >
            <option value="">All countries</option>
            {countryList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {!isLoading && (
        <p className="text-xs text-zinc-400">
          {total === 0
            ? "No results"
            : `${total} supplier${total !== 1 ? "s" : ""} found`}
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {Array.from({ length: pageSize }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : suppliers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <Building2 size={48} className="text-zinc-200 mb-4" strokeWidth={1} />
          <p className="text-zinc-500 font-medium">No suppliers found</p>
          <p className="text-zinc-400 text-sm mt-1">Try adjusting your search or filters</p>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="mt-4 text-sm text-primary underline underline-offset-2 hover:opacity-70"
            >
              Clear all filters
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          key={currentPage}
          variants={gridVariants}
          initial="initial"
          animate="animate"
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch transition-opacity duration-200 ${
            isFetching && !isLoading ? "opacity-60" : ""
          }`}
        >
          {suppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              expanded={!!expandedIds[supplier.id]}
              onToggle={() => handleToggle(supplier.id)}
              isLoggedIn={isLoggedIn}
              callbackPath={pathname}
            />
          ))}
        </motion.div>
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
    </motion.div>
  )
}
