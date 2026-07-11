"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Search, Edit2, Trash2, Copy, Eye, EyeOff, Star, StarOff,
  Calculator, CheckCircle2, Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Calculator as Calc, CalcCategory } from "@/types/calculator"
import {
  deleteCalculator,
  duplicateCalculator,
  togglePublished,
} from "@/services/calculator.service"

type Row = Calc & { category: CalcCategory | null }

export default function CalculatorsTable({ initialData }: { initialData: Row[] }) {
  const [rows, setRows] = useState(initialData)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all")
  const [isPending, startTransition] = useTransition()

  const filtered = rows.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.short_description?.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && r.is_published) ||
      (statusFilter === "draft" && !r.is_published)
    return matchSearch && matchStatus
  })

  function handleToggle(id: string, published: boolean) {
    startTransition(async () => {
      try {
        await togglePublished(id, published)
        setRows((prev) => prev.map((r) => r.id === id ? { ...r, is_published: published } : r))
        toast.success(published ? "Published" : "Unpublished")
      } catch {
        toast.error("Failed to update status")
      }
    })
  }

  function handleDuplicate(id: string) {
    startTransition(async () => {
      try {
        const copy = await duplicateCalculator(id)
        setRows((prev) => [{ ...copy, category: prev.find((r) => r.id === id)?.category ?? null }, ...prev])
        toast.success("Engineering tool duplicated")
      } catch {
        toast.error("Failed to duplicate")
      }
    })
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    startTransition(async () => {
      try {
        await deleteCalculator(id)
        setRows((prev) => prev.filter((r) => r.id !== id))
        toast.success("Deleted")
      } catch {
        toast.error("Failed to delete")
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search engineering tools…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "published", "draft"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors",
                statusFilter === s
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-sm text-zinc-500">
        <span><strong className="text-zinc-900">{rows.length}</strong> total</span>
        <span><strong className="text-emerald-600">{rows.filter((r) => r.is_published).length}</strong> published</span>
        <span><strong className="text-amber-600">{rows.filter((r) => !r.is_published).length}</strong> draft</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Calculator className="size-10 mb-3 text-zinc-200" />
            <p className="text-sm font-medium">No engineering tools found</p>
            <Link href="/dashboard/calculators/new" className="mt-4 text-sm text-primary hover:underline">
              Create your first engineering tool →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Engineering Tool</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Featured</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Views</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">{row.title}</div>
                      {row.short_description && (
                        <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{row.short_description}</div>
                      )}
                      <div className="text-xs text-zinc-300 mt-0.5 font-mono">/tools/{row.slug}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {row.category ? (
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                          {row.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {row.is_published ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="size-3" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <Clock className="size-3" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {row.is_featured ? (
                        <Star className="size-4 text-amber-400 fill-amber-400 mx-auto" />
                      ) : (
                        <StarOff className="size-4 text-zinc-200 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <span className="text-xs text-zinc-500">{row.views_count ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/tools/${row.slug}`}
                          target="_blank"
                          className="rounded-md p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                          title="Preview"
                        >
                          <Eye className="size-4" />
                        </Link>
                        <button
                          onClick={() => handleToggle(row.id, !row.is_published)}
                          disabled={isPending}
                          className="rounded-md p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                          title={row.is_published ? "Unpublish" : "Publish"}
                        >
                          {row.is_published ? <EyeOff className="size-4" /> : <Eye className="size-4 text-emerald-600" />}
                        </button>
                        <button
                          onClick={() => handleDuplicate(row.id)}
                          disabled={isPending}
                          className="rounded-md p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="size-4" />
                        </button>
                        <Link
                          href={`/dashboard/calculators/${row.id}/edit`}
                          className="rounded-md p-1.5 text-zinc-400 hover:text-primary hover:bg-primary/5 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="size-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(row.id, row.title)}
                          disabled={isPending}
                          className="rounded-md p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
