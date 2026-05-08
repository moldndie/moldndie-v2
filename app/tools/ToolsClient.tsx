"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Calculator, ChevronRight, Wrench, ArrowRight, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import { DraftAngleCalculator } from "./calculators/DraftAngleCalculator"
import { WallThicknessAdvisor } from "./calculators/WallThicknessAdvisor"
import { ShrinkageCalculator } from "./calculators/ShrinkageCalculator"
import { GateAreaCalculator } from "./calculators/GateAreaCalculator"
import type { Calculator as DBCalc, CalcCategory } from "@/types/calculator"

// ── Legacy static tools ────────────────────────────────────────────────────────

interface LegacyTool {
  id: string
  label: string
  description: string
  category: "Injection Mold" | "Die Casting" | "Sheet Metal"
  component: React.ComponentType
}

const LEGACY_TOOLS: LegacyTool[] = [
  { id: "draft-angle",    label: "Draft Angle Calculator",   description: "Calculate recommended draft angles based on material and surface finish.", category: "Injection Mold", component: DraftAngleCalculator },
  { id: "wall-thickness", label: "Wall Thickness Advisor",   description: "Get recommended wall thickness range for common engineering polymers.",   category: "Injection Mold", component: WallThicknessAdvisor },
  { id: "shrinkage",      label: "Shrinkage Calculator",     description: "Compute mold cavity dimensions accounting for material shrinkage.",        category: "Injection Mold", component: ShrinkageCalculator },
  { id: "gate-area",      label: "Gate Area Estimator",      description: "Estimate minimum gate cross-section area for part weight and fill time.",  category: "Injection Mold", component: GateAreaCalculator },
]

const LEGACY_CATEGORIES = Array.from(new Set(LEGACY_TOOLS.map((t) => t.category)))

const reveal = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" } as const,
  transition: { duration: 0.3, ease: "easeOut" as const },
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  dbCalculators: (DBCalc & { category: CalcCategory | null })[]
  categories: CalcCategory[]
}

export function ToolsClient({ dbCalculators, categories }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [legacyCat, setLegacyCat] = useState<string>("All")
  const [dbSearch, setDbSearch] = useState("")
  const [dbCat, setDbCat] = useState<string>("all")

  const activeTool = LEGACY_TOOLS.find((t) => t.id === activeId)
  const filteredLegacy = legacyCat === "All" ? LEGACY_TOOLS : LEGACY_TOOLS.filter((t) => t.category === legacyCat)
  const filteredDb = dbCalculators.filter((c) => {
    const matchSearch = !dbSearch || c.title.toLowerCase().includes(dbSearch.toLowerCase()) || c.short_description?.toLowerCase().includes(dbSearch.toLowerCase())
    const matchCat = dbCat === "all" || c.category_id === dbCat
    return matchSearch && matchCat
  })
  const featuredDb = dbCalculators.filter((c) => c.is_featured).slice(0, 3)

  return (
    <div>
      {/* Hero */}
      <section className="bg-zinc-950 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4"><PublicBreadcrumb crumbs={[{ label: "Engineering" }]} /></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20"><Calculator size={20} className="text-primary" /></div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Free Tools</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase leading-tight tracking-tight mb-4">
            Engineering <span className="text-primary">Calculators</span>
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl">Practical online calculators for mold and die engineers. No sign-in required. Results are for reference — always verify with your material datasheet.</p>
        </div>
      </section>

      {/* ── DB Calculators ──────────────────────────────────────────────────── */}
      {dbCalculators.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-14">
          {featuredDb.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-5">
                <Zap className="size-4 text-amber-500 fill-amber-400" />
                <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wide">Featured</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {featuredDb.map((c) => (
                  <Link key={c.id} href={`/tools/${c.slug}`} className="group rounded-xl border border-amber-200 bg-amber-50 p-5 hover:border-amber-400 hover:shadow-md transition-all">
                    <p className="text-sm font-bold text-zinc-900 group-hover:text-primary transition-colors">{c.title}</p>
                    {c.short_description && <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2">{c.short_description}</p>}
                    <p className="mt-3 text-xs font-semibold text-primary flex items-center gap-1">Open calculator <ArrowRight className="size-3" /></p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input type="text" value={dbSearch} onChange={(e) => setDbSearch(e.target.value)} placeholder="Search calculators…" className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            {categories.length > 0 && (
              <select
                value={dbCat}
                onChange={(e) => setDbCat(e.target.value)}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary sm:w-48"
              >
                <option value="all">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}
          </div>

          {filteredDb.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDb.map((c) => (
                <motion.div key={c.id} {...reveal}>
                  <Link href={`/tools/${c.slug}`} className="group flex flex-col h-full rounded-xl border border-zinc-200 bg-white p-5 hover:border-primary hover:shadow-md transition-all">
                    {c.category && <span className="inline-block self-start rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary mb-3">{c.category.name}</span>}
                    <p className="text-sm font-bold text-zinc-900 group-hover:text-primary transition-colors leading-snug">{c.title}</p>
                    {c.short_description && <p className="text-xs text-zinc-400 mt-2 leading-relaxed line-clamp-3 flex-1">{c.short_description}</p>}
                    <p className="mt-4 text-xs font-semibold text-primary flex items-center gap-1">Open <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" /></p>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400 py-8 text-center">No calculators found.</p>
          )}
        </section>
      )}

      {/* ── Legacy Specialist Tools ─────────────────────────────────────────── */}
      <section className={cn("max-w-6xl mx-auto px-6 pb-14", dbCalculators.length > 0 ? "border-t border-zinc-100 pt-14" : "pt-14")}>
        <div className="flex items-center gap-2 mb-6">
          <Wrench className="size-4 text-zinc-400" />
          <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wide">Specialist Tools</h2>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {["All", ...LEGACY_CATEGORIES].map((cat) => (
            <button key={cat} onClick={() => { setLegacyCat(cat); setActiveId(null) }} className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-colors", legacyCat === cat ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}>{cat}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-3">
            {filteredLegacy.map((tool) => (
              <motion.button key={tool.id} {...reveal} onClick={() => setActiveId(tool.id === activeId ? null : tool.id)} className={cn("w-full text-left rounded-xl border p-4 transition-all", activeId === tool.id ? "border-primary bg-primary/5 shadow-md" : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary mb-1.5 inline-block">{tool.category}</span>
                    <p className={cn("text-sm font-semibold leading-snug", activeId === tool.id ? "text-primary" : "text-zinc-900")}>{tool.label}</p>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{tool.description}</p>
                  </div>
                  <ChevronRight size={14} className={cn("shrink-0 mt-0.5 transition-transform text-zinc-400", activeId === tool.id ? "rotate-90 text-primary" : "")} />
                </div>
              </motion.button>
            ))}
            {filteredLegacy.length === 0 && <p className="text-sm text-zinc-400 text-center py-8">No tools in this category.</p>}
          </div>

          <div className="lg:col-span-2">
            {activeTool ? (
              <motion.div key={activeTool.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10"><Wrench size={16} className="text-primary" /></div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-900">{activeTool.label}</h2>
                    <p className="text-xs text-zinc-400">{activeTool.description}</p>
                  </div>
                </div>
                <activeTool.component />
              </motion.div>
            ) : (
              <div className="hidden lg:flex h-full min-h-64 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 text-center p-8">
                <div>
                  <Calculator size={36} className="text-zinc-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-zinc-400">Select a tool from the list</p>
                  <p className="text-xs text-zinc-300 mt-1">Results appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
