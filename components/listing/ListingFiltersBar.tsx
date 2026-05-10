"use client"

import { Search, X } from "lucide-react"
import { Select } from "@/components/ui/select"

export interface SortOption {
  label: string
  value: string
}

interface Category {
  id: string
  name: string
}

interface ListingFiltersBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string

  sortValue: string
  onSortChange: (value: string) => void
  sortOptions: SortOption[]

  categories?: Category[]
  categoryValue?: string
  onCategoryChange?: (value: string | null) => void
  categoryPlaceholder?: string

  hasActiveFilters: boolean
  onClear: () => void
  isFetching?: boolean
}

export function ListingFiltersBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  sortValue,
  onSortChange,
  sortOptions,
  categories,
  categoryValue = "",
  onCategoryChange,
  categoryPlaceholder = "All categories",
  hasActiveFilters,
  onClear,
  isFetching,
}: ListingFiltersBarProps) {
  const showCategory = !!categories && !!onCategoryChange

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

        <div className="flex flex-wrap items-center gap-2">

          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full sm:w-52 rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          {showCategory && (
            <Select
              value={categoryValue}
              onChange={(e) => onCategoryChange!(e.target.value || null)}
              className="w-full sm:w-40"
            >
              <option value="">{categoryPlaceholder}</option>
              {categories!.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          )}

          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors whitespace-nowrap"
            >
              <X size={13} />
              Clear filters
            </button>
          )}
        </div>

        <Select
          value={sortValue}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full sm:w-44 shrink-0"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>

      {isFetching && (
        <div className="h-0.5 w-full rounded-full overflow-hidden bg-zinc-100">
          <div className="h-full w-1/3 bg-primary/40 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full" />
        </div>
      )}
    </div>
  )
}
