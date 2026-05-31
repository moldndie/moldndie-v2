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
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-zinc-950 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <PublicBreadcrumb crumbs={[{ label: "Engineering" }]} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20">
              <Wrench size={20} className="text-primary" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Free Tools
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase leading-tight tracking-tight mb-4">
            Engineering <span className="text-primary">Tools</span>
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl">
            Free, high-accuracy tools to streamline the design of injection molds,
            pressure die-casting molds, and sheet metal dies.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14">
        {/* ── Featured ─────────────────────────────────────────────────── */}
        {featured.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="size-4 text-amber-500 fill-amber-400" />
              <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wide">
                Featured Tools
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {featured.map((c) => (
                <Link
                  key={c.id}
                  href={`/tools/${c.slug}`}
                  className="group rounded-xl border border-amber-200 bg-amber-50 p-5 hover:border-amber-400 hover:shadow-md transition-all"
                >
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

        {/* ── Specialist Tools ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-6">
          <Wrench className="size-4 text-zinc-400" />
          <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wide">
            Specialist Tools
          </h2>
        </div>

        {/* Search bar */}
        <div className="mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools…"
            className="w-full sm:max-w-sm rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                  ? "bg-zinc-900 text-white"
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
                    ? "bg-zinc-900 text-white"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <motion.div key={c.id} {...reveal}>
                <Link
                  href={`/tools/${c.slug}`}
                  className="group flex flex-col h-full rounded-xl border border-zinc-200 bg-white p-5 hover:border-primary hover:shadow-md transition-all"
                >
                  {c.category && (
                    <span className="inline-block self-start rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary mb-3">
                      {c.category.name}
                    </span>
                  )}
                  <p className="text-sm font-bold text-zinc-900 group-hover:text-primary transition-colors leading-snug">
                    {c.title}
                  </p>
                  {c.short_description && (
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed line-clamp-3 flex-1">
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
      </section>
    </div>
  )
}
