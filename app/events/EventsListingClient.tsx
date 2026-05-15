"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { CalendarDays, MapPin, MapPinned, ChevronDown, Lock, Globe } from "lucide-react"
import { ListingFiltersBar } from "@/components/listing/ListingFiltersBar"
import { Pagination } from "@/components/listing/Pagination"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import { useEventsListing, useEventCategories } from "@/hooks/queries/useEvents"
import type { EventSort } from "@/hooks/queries/useEvents"
import { createClient } from "@/lib/supabase/client"

const DEFAULT_PAGE_SIZE = 6
const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

const SORT_OPTIONS: { label: string; value: EventSort }[] = [
  { label: "Country A → Z", value: "country_asc" },
  { label: "Event A → Z",   value: "title_asc" },
]

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}
const gridVariants = {
  animate: { transition: { staggerChildren: 0.05 } },
}
const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return "Date TBA"
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatEventDateLong(dateStr: string | null): string {
  if (!dateStr) return "Date TBA"
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  })
}

function isUpcoming(dateStr: string | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr) >= new Date()
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

function EventExpandedContent({ event }: {
  event: { event_date: string | null; start_date: string | null; end_date: string | null; country: string | null; address: string | null; description: string | null; website?: string | null }
}) {
  const displayStart = event.start_date || event.event_date
  const displayEnd = event.end_date

  return (
    <div className="border-t border-zinc-100 bg-zinc-50/70 px-4 py-4 space-y-3">
      <div className="flex items-center gap-2 text-sm text-zinc-700">
        <CalendarDays size={13} className="text-zinc-400 shrink-0" />
        <span className="font-medium">
          {formatEventDateLong(displayStart)}
          {displayEnd && displayEnd !== displayStart && (
            <> &rarr; {formatEventDate(displayEnd)}</>
          )}
        </span>
      </div>
      {event.country && (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <MapPin size={13} className="text-zinc-400 shrink-0" />
          {event.country}
        </div>
      )}
      {event.address && (
        <div className="flex items-start gap-2 text-sm text-zinc-500">
          <MapPinned size={13} className="mt-0.5 shrink-0 text-zinc-400" />
          {event.address}{event.country ? `, ${event.country}` : ""}
        </div>
      )}
      {event.website && (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Globe size={13} className="text-zinc-400 shrink-0" />
          <a href={event.website} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:opacity-70">
            {event.website}
          </a>
        </div>
      )}
      {event.description && (
        <p className="text-sm text-zinc-600 leading-relaxed pt-1 border-t border-zinc-100">
          {event.description}
        </p>
      )}
      {event.website && (
        <a
          href={event.website}
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

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-100 bg-white animate-pulse">
      <div className="aspect-video bg-zinc-200" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 bg-zinc-200 rounded w-1/3" />
        <div className="h-4 bg-zinc-200 rounded w-3/4" />
        <div className="h-3 bg-zinc-100 rounded w-1/4" />
      </div>
    </div>
  )
}

function EventCard({
  event,
  expanded,
  onToggle,
  isLoggedIn,
  callbackPath,
}: {
  event: {
    id: string
    title: string
    image_path: string | null
    event_date: string | null
    start_date: string | null
    end_date: string | null
    country: string | null
    address: string | null
    description: string | null
    website?: string | null
    category?: { name: string } | null
  }
  expanded: boolean
  onToggle: () => void
  isLoggedIn: boolean | null
  callbackPath: string
}) {
  const imgSrc       = event.image_path ? `${R2_BASE}/${event.image_path}` : null
  const displayDate  = event.start_date || event.event_date
  const upcoming     = isUpcoming(displayDate)
  const showGate     = expanded && isLoggedIn === false

  return (
    <motion.div
      variants={cardVariants}
      className={`rounded-xl overflow-hidden border bg-white shadow-sm transition-colors duration-200 flex flex-col h-full ${
        expanded ? "border-primary shadow-md" : "border-zinc-100 hover:shadow-lg hover:border-zinc-200"
      }`}
    >
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1 }}
        className="w-full text-left flex flex-col"
      >
        <div className="aspect-video relative bg-zinc-50 overflow-hidden shrink-0">
          {imgSrc ? (
            <Image src={imgSrc} alt={event.title} fill className="object-contain" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CalendarDays size={36} className="text-zinc-300" strokeWidth={1} />
            </div>
          )}
          {displayDate && (
            <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase ${upcoming ? "bg-emerald-500 text-white" : "bg-zinc-600 text-white"}`}>
              {upcoming ? "Upcoming" : "Past"}
            </span>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
            <CalendarDays size={12} className="shrink-0" />
            {formatEventDate(displayDate)}
            {event.end_date && event.end_date !== displayDate && (
              <> &ndash; {formatEventDate(event.end_date)}</>
            )}
          </div>
          <h3 className={`text-sm font-bold leading-snug line-clamp-2 transition-colors ${expanded ? "text-primary" : "text-zinc-900"}`}>
            {event.title}
          </h3>
          <div className="mt-auto pt-1 flex items-center justify-between">
            {event.country && (
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <MapPin size={11} className="shrink-0" />
                {event.country}
              </div>
            )}
            {event.category && <span className="text-xs text-zinc-400">{event.category.name}</span>}
          </div>
          <div className="flex justify-center pt-1">
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={15} className="text-zinc-400" />
            </motion.div>
          </div>
        </div>
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
            <div className="relative min-h-22.5">
              {/* Content — blurred for guests */}
              <div className={showGate ? "blur-[3px] pointer-events-none select-none" : ""}>
                <EventExpandedContent event={{ ...event, start_date: event.start_date, end_date: event.end_date }} />
              </div>
              {/* Login gate overlay */}
              {showGate && <LoginGate callbackPath={callbackPath} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function EventsListingClient() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const [inputValue, setInputValue]             = useState(() => searchParams.get("search") ?? "")
  const [searchTerm, setSearchTerm]             = useState(() => searchParams.get("search") ?? "")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => searchParams.get("category"))
  const [sort, setSort]                         = useState<EventSort>(() => (searchParams.get("sort") as EventSort) ?? "country_asc")
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
    if (searchTerm)                          p.set("search",   searchTerm)
    if (selectedCategory)                    p.set("category", selectedCategory)
    if (sort !== "country_asc")              p.set("sort",     sort)
    if (currentPage > 1)                     p.set("page",     String(currentPage))
    const qs = p.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [searchTerm, selectedCategory, sort, currentPage, pathname, router])

  const handleCategoryChange = useCallback((id: string | null) => { setSelectedCategory(id); setCurrentPage(1) }, [])
  const handleSort           = useCallback((v: string) => { setSort(v as EventSort); setCurrentPage(1) }, [])
  const clearAll             = useCallback(() => {
    setInputValue(""); setSearchTerm(""); setSelectedCategory(null); setSort("country_asc"); setCurrentPage(1)
  }, [])

  const { data, isLoading, isFetching } = useEventsListing({
    search: searchTerm,
    categoryId: selectedCategory,
    sort,
    page: currentPage,
    pageSize,
  })
  const { data: categories } = useEventCategories()

  const events     = data?.data ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)
  const hasActiveFilters = !!searchTerm || !!selectedCategory || sort !== "country_asc"

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
        <PublicBreadcrumb crumbs={[{ label: "Events" }]} />
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">Events</h1>
        <p className="mt-1 text-sm text-zinc-500">Upcoming and past mold &amp; die industry events worldwide</p>
      </div>

      <ListingFiltersBar
        searchValue={inputValue}
        onSearchChange={setInputValue}
        searchPlaceholder="Search events…"
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

      {!isLoading && (
        <p className="text-xs text-zinc-400">
          {total === 0 ? "No results" : `${total} event${total !== 1 ? "s" : ""} found`}
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {Array.from({ length: pageSize }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
          <CalendarDays size={48} className="text-zinc-200 mb-4" strokeWidth={1} />
          <p className="text-zinc-500 font-medium">No events found</p>
          <p className="text-zinc-400 text-sm mt-1">Try adjusting your search or filters</p>
          {hasActiveFilters && (
            <button onClick={clearAll} className="mt-4 text-sm text-primary underline underline-offset-2 hover:opacity-70">
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
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch transition-opacity duration-200 ${isFetching && !isLoading ? "opacity-60" : ""}`}
        >
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              expanded={!!expandedIds[event.id]}
              onToggle={() => handleToggle(event.id)}
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
