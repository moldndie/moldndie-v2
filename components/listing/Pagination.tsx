import { ChevronLeft, ChevronRight } from "lucide-react"

const DEFAULT_PAGE_SIZE_OPTIONS = [9, 12, 18, 24]

interface PaginationProps {
  currentPage: number
  totalPages: number
  onChange: (page: number) => void
  pageSize?: number
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
}

export function Pagination({
  currentPage,
  totalPages,
  onChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: PaginationProps) {
  const pages: (number | "…")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push("…")
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) pages.push(i)
    if (currentPage < totalPages - 2) pages.push("…")
    pages.push(totalPages)
  }

  const showPageSize = !!onPageSizeChange && !!pageSize

  if (totalPages <= 1 && !showPageSize) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Page size selector */}
      {showPageSize && (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span>Show</span>
          <div className="flex gap-1">
            {pageSizeOptions.map((size) => (
              <button
                key={size}
                onClick={() => onPageSizeChange(size)}
                aria-pressed={size === pageSize}
                className="ui-pill min-w-9 h-8 rounded-lg border text-sm font-medium"
              >
                {size}
              </button>
            ))}
          </div>
          <span>per page</span>
        </div>
      )}

      {/* Page navigation */}
      {totalPages > 1 && (
        <div className={`flex items-center gap-1 ${!showPageSize ? "mx-auto" : ""}`}>
          <button
            onClick={() => onChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="ui-pill p-2 rounded-lg border"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="px-2 text-zinc-400 text-sm select-none">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p as number)}
                aria-current={p === currentPage ? "page" : undefined}
                className="ui-pill min-w-9 h-9 rounded-lg border text-sm font-medium"
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ui-pill p-2 rounded-lg border"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
