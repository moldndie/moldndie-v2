"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Wrench, ArrowRight, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import type { Calculator as DBCalc, CalcCategory } from "@/types/calculator"

const reveal = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" } as const,
  transition: { duration: 0.3, ease: "easeOut" as const },
}

interface Props {
  dbCalculators: (DBCalc & { category: CalcCategory | null })[]
  categories: CalcCategory[]
}

export function ToolsClient({ dbCalculators, categories }: Props) {
  const [search, setSearch] = useState("")
  const [activeCat, setActiveCat] = useState<string>("all")

  const featured = dbCalculators.filter((c) => c.is_featured).slice(0, 3)

  const filtered = dbCalculators.filter((c) => {
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.short_description ?? "").toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCat === "all" || c.category_id === activeCat
    return matchSearch && matchCat
  })

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* ── Heading ───────────────────────────────────────────────────── */}
      <div>
        <PublicBreadcrumb crumbs={[{ label: "Engineering" }]} />
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">
          Engineering Tools
        </h1>
        <p className="mt-1 text-sm text-zinc-500 max-w-2xl">
          Free, high-accuracy tools to streamline the design of injection molds,
          pressure die-casting molds, and sheet metal dies.
        </p>
      </div>

      {/* ── Featured ─────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wide mb-4">
            Featured Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((c) => (
              <Link
                key={c.id}
                href={`/tools/${c.slug}`}
                className="group flex flex-col rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <span className="inline-flex items-center gap-1 self-start rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary mb-3">
                  <Zap className="size-2.5 fill-current" />
                  Featured
                </span>
                <p className="text-sm font-bold text-zinc-900 group-hover:text-primary transition-colors">
                  {c.title}
                </p>
                {c.short_description && (
                  <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2">
                    {c.short_description}
                  </p>
                )}
                <p className="mt-3 text-xs font-semibold text-primary flex items-center gap-1">
                  Open tool <ArrowRight className="size-3" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── All tools ────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wide mb-4">
          All Tools
        </h2>

        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools…"
            className="w-full sm:max-w-sm rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCat("all")}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activeCat === "all"
                  ? "bg-primary text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  activeCat === cat.id
                    ? "bg-primary text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Tools grid */}
        {dbCalculators.length === 0 ? (
          <div className="py-24 text-center">
            <Wrench size={40} className="text-zinc-200 mx-auto mb-4" strokeWidth={1} />
            <p className="text-zinc-500 font-medium">No tools published yet</p>
            <p className="text-zinc-400 text-sm mt-1">Check back soon for engineering tools.</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-zinc-400 py-10 text-center">
            No tools match your search.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => (
              <motion.div key={c.id} {...reveal}>
                <Link
                  href={`/tools/${c.slug}`}
                  className="group flex flex-col h-full rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {c.category && (
                    <span className="inline-block self-start rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary mb-3">
                      {c.category.name}
                    </span>
                  )}
                  <p className="text-sm font-bold text-zinc-900 group-hover:text-primary transition-colors leading-snug">
                    {c.title}
                  </p>
                  {c.short_description && (
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed line-clamp-3 flex-1">
                      {c.short_description}
                    </p>
                  )}
                  <p className="mt-4 text-xs font-semibold text-primary flex items-center gap-1">
                    Open tool{" "}
                    <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
