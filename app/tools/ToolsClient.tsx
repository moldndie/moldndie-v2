"use client"

import { useState } from "react"
import Link from "next/link"
import { Wrench, ArrowRight, Zap } from "lucide-react"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import type { Calculator as DBCalc, CalcCategory } from "@/types/calculator"
import { Input } from "@/components/ui/input"
import theme from "./engineering-theme.module.css"

export type DirectoryCalculator = Pick<DBCalc, "id" | "slug" | "title" | "short_description" | "category_id" | "is_featured" | "is_published"> & {
  category: CalcCategory | null
}

interface Props {
  dbCalculators: DirectoryCalculator[]
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 space-y-10">
      {/* ── Heading ───────────────────────────────────────────────────── */}
      <header className={theme.hero}>
        <PublicBreadcrumb crumbs={[{ label: "Engineering" }]} />
        <p className={theme.eyebrow}>MoldNDie Engineering</p>
        <h1 className={theme.title}>Engineering Tools</h1>
        <p className={theme.lead}>
          Explore free calculators and reference guides for injection molds, pressure die-casting molds, and sheet metal dies.
        </p>
      </header>

      {/* ── Featured ─────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <div>
          <h2 className={`${theme.heading} mb-4`}>
            Featured Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((c) => (
              <Link
                key={c.id}
                href={`/tools/${c.slug}`}
                className={`group flex flex-col p-5 ${theme.card}`}
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
        <h2 className={`${theme.heading} mb-4`}>
          All Tools
        </h2>

        {/* Search bar */}
        <div className="mb-4">
          <Input
            type="search"
            aria-label="Search tools"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools…"
            className="w-full sm:max-w-sm rounded-xl px-4 py-3"
          />
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCat("all")}
              aria-pressed={activeCat === "all"}
              className={`${theme.pill} rounded-full border px-4 py-1.5 text-sm font-semibold`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                aria-pressed={activeCat === cat.id}
                className={`${theme.pill} rounded-full border px-4 py-1.5 text-sm font-semibold`}
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
              <Link
                key={c.id}
                href={`/tools/${c.slug}`}
                className={`group flex flex-col h-full p-5 ${theme.card}`}
              >
                {c.category && (
                  <span className="inline-block self-start rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary mb-3">
                    {c.category.name}
                  </span>
                )}
                {process.env.NODE_ENV === "development" && !c.is_published && (
                  <span className="mb-2 inline-flex self-start rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Local preview
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
