"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ChevronLeft, ChevronRight, Building2, MapPin, Globe, MapPinned, ChevronDown } from "lucide-react"
import { useSuppliersListing, useSupplierCategories } from "@/hooks/queries/useSuppliers"

const PAGE_SIZE = 12
const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

// Animation variants
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
          className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
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
}: {
  supplier: {
    id: string
    name: string
    description: string | null
    logo_path: string | null
    country: string | null
    website: string | null
    address: string | null
    category?: { name: string } | null
  }
  expanded: boolean
  onToggle: () => void
}) {
  const logoSrc = supplier.logo_path ? `${R2_BASE}/${supplier.logo_path}` : null

  return (
    <motion.div
      variants={cardVariants}
      className={`rounded-xl overflow-hidden border bg-white shadow-sm transition-colors duration-200 ${
        expanded ? "border-primary shadow-md" : "border-zinc-100 hover:shadow-lg hover:border-zinc-200"
      }`}
    >
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1 }}
        className="w-full p-5 flex flex-col items-center text-center gap-3"
      >
        <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-50 border border-zinc-100 shrink-0 relative flex items-center justify-center">
          {logoSrc ? (
            <Image src={logoSrc} alt={supplier.name} fill className="object-contain p-1" sizes="56px" />
          ) : (
            <Building2 size={24} className="text-zinc-300" strokeWidth={1} />
          )}
        </div>

        <div className="min-w-0 w-full">
          <h3 className={`text-sm font-bold leading-snug line-clamp-2 transition-colors ${expanded ? "text-primary" : "text-zinc-900"}`}>
            {supplier.name}
          </h3>
          {supplier.category && (
            <span className="text-xs text-primary font-medium mt-0.5 block">{supplier.category.name}</span>
          )}
          {supplier.country && (
            <div className="flex items-center justify-center gap-1 text-xs text-zinc-400 mt-1.5">
              <MapPin size={11} className="shrink-0" />
              {supplier.country}
            </div>
          )}
        </div>

        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={15} className="text-zinc-400" />
        </motion.div>
      </motion.button>

      {/* Animated expand/collapse */}
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
            <SupplierExpandedContent supplier={supplier} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-100 bg-white animate-pulse">
      <div className="p-5 flex flex-col items-center gap-3">
        <div className="w-14 h-14 bg-zinc-200 rounded-full" />
        <div className="h-4 bg-zinc-200 rounded w-2/3" />
        <div className="h-3 bg-zinc-100 rounded w-1/3" />
      </div>
    </div>
  )
}

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
        active ? "bg-primary text-white border-primary" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
      }`}
    >
      {children}
    </motion.button>
  )
}

function Pagination({ currentPage, totalPages, onChange }: { currentPage: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  const pages: (number | "…")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push("…")
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push("…")
    pages.push(totalPages)
  }
  return (
    <div className="flex items-center justify-center gap-1">
      <button onClick={() => onChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Previous page">
        <ChevronLeft size={16} />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="px-2 text-zinc-400 text-sm select-none">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p as number)} className={`min-w-9 h-9 rounded-lg border text-sm font-medium transition-colors ${p === currentPage ? "bg-primary text-white border-primary" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>{p}</button>
        )
      )}
      <button onClick={() => onChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Next page">
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

export default function SuppliersListingClient() {
  const [inputValue, setInputValue]             = useState("")
  const [searchTerm, setSearchTerm]             = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [currentPage, setCurrentPage]           = useState(1)
  const [expandedId, setExpandedId]             = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => { setSearchTerm(inputValue); setCurrentPage(1) }, 300)
    return () => clearTimeout(t)
  }, [inputValue])

  const handleCategoryChange = useCallback((id: string | null) => { setSelectedCategory(id); setCurrentPage(1) }, [])
  const clearAll = useCallback(() => { setInputValue(""); setSearchTerm(""); setSelectedCategory(null); setCurrentPage(1) }, [])

  const { data, isLoading, isFetching } = useSuppliersListing({ search: searchTerm, categoryId: selectedCategory, page: currentPage, pageSize: PAGE_SIZE })
  const { data: categories } = useSupplierCategories()

  const suppliers  = data?.data ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasActiveFilters = !!searchTerm || !!selectedCategory

  const handleToggle = (id: string) => setExpandedId(expandedId === id ? null : id)

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-7xl mx-auto px-6 py-10 space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">Suppliers</h1>
        <p className="mt-1 text-sm text-zinc-500">Browse our verified network of mold and die suppliers</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Search suppliers…" className="w-full pl-9 pr-4 py-2.5 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
        </div>
        {categories && categories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <PillButton active={selectedCategory === null} onClick={() => handleCategoryChange(null)}>All</PillButton>
            {categories.map((cat) => (
              <PillButton key={cat.id} active={selectedCategory === cat.id} onClick={() => handleCategoryChange(cat.id)}>{cat.name}</PillButton>
            ))}
          </div>
        )}
      </div>

      {/* Meta */}
      {!isLoading && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            {total === 0 ? "No results" : `${total} supplier${total !== 1 ? "s" : ""} found`}
            {isFetching && !isLoading && <span className="ml-2 text-zinc-300">Updating…</span>}
          </p>
          {hasActiveFilters && <button onClick={clearAll} className="text-xs text-primary underline underline-offset-2 hover:opacity-70 transition-opacity">Clear filters</button>}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
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
          {hasActiveFilters && <button onClick={clearAll} className="mt-4 text-sm text-primary underline underline-offset-2 hover:opacity-70 transition-opacity">Clear filters</button>}
        </motion.div>
      ) : (
        <motion.div
          key={currentPage}
          variants={gridVariants}
          initial="initial"
          animate="animate"
          className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 transition-opacity duration-200 ${isFetching && !isLoading ? "opacity-60" : "opacity-100"}`}
        >
          {suppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              expanded={expandedId === supplier.id}
              onToggle={() => handleToggle(supplier.id)}
            />
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="pt-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
        </div>
      )}
    </motion.div>
  )
}
