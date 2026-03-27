"use client"

import { useRef, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import type { BlogCategory, BlogTag } from "@/types"

interface BlogFiltersBarProps {
  categories: BlogCategory[]
  tags: BlogTag[]
  currentQ: string
  currentCategory: string
  currentTags: string[]
}

export function BlogFiltersBar({
  categories,
  tags,
  currentQ,
  currentCategory,
  currentTags,
}: BlogFiltersBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

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

  const hasFilters = currentQ || currentCategory || currentTags.length > 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search blogs…"
            defaultValue={currentQ}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-52"
          />
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <select
            value={currentCategory}
            onChange={(e) => updateParams({ category: e.target.value || null })}
            className="py-2 px-3 text-sm rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={() => startTransition(() => router.replace(pathname))}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <X className="size-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const active = currentTags.includes(tag.id)
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
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
