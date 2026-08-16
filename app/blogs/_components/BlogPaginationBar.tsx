"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface BlogPaginationBarProps {
  currentPage: number
  totalPages: number
}

export function BlogPaginationBar({ currentPage, totalPages }: BlogPaginationBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("pageSize")
    if (page > 1) params.set("page", String(page))
    else params.delete("page")
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

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

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <button
        onClick={() => goToPage(currentPage - 1)}
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
            onClick={() => goToPage(p as number)}
            aria-current={p === currentPage ? "page" : undefined}
            className="ui-pill min-w-9 h-9 rounded-lg border text-sm font-medium"
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="ui-pill p-2 rounded-lg border"
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
