"use client"

import { useRef, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { Select } from "@/components/ui/select"
import type { BlogCategory, BlogTag } from "@/types"

const SORT_OPTIONS = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "A → Z",        value: "title_asc" },
]

interface BlogFiltersBarProps {
  categories: BlogCategory[]
  tags: BlogTag[]
  currentQ: string
  currentCategory: string
  currentTags: string[]
  currentSort: string
}

export function BlogFiltersBar({
  categories,
  tags,
  currentQ,
  currentCategory,
  currentTags,
  currentSort,
}: BlogFiltersBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    const qs = params.toString()
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    })
  }

  function handleSearch(value: string) {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateParams({ q: value || null }), 400)
  }

  function toggleTag(tagId: string) {
    const next = currentTags.includes(tagId)
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId]
    updateParams({ tags: next.length > 0 ? next.join(",") : null })
  }

  const hasFilters =
    !!currentQ || !!currentCategory || currentTags.length > 0 || currentSort !== "newest"

  return (
    <div className="flex flex-col gap-3">
      {/* ── Row 1: filters left — sort right ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

        {/* LEFT: search + category + clear */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search blogs…"
              defaultValue={currentQ}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-9 w-full sm:w-52 rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <Select
              value={currentCategory}
              onChange={(e) => updateParams({ category: e.target.value || null })}
              className="w-full sm:w-44"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          )}

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={() => startTransition(() => router.replace(pathname))}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors whitespace-nowrap"
            >
              <X className="size-3.5" />
              Clear filters
            </button>
          )}
        </div>

        {/* RIGHT: sort */}
        <Select
          value={currentSort}
          onChange={(e) =>
            updateParams({ sort: e.target.value === "newest" ? null : e.target.value })
          }
          className="w-full sm:w-40 shrink-0"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>

      {/* ── Row 2: tags ── */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const active = currentTags.includes(tag.id)
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`h-7 rounded-full border px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-input bg-background text-zinc-600 hover:border-zinc-400"
                }`}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
