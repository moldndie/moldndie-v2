"use client"

import { useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus } from "lucide-react"
import { DataTable } from "./DataTable"
import { AdModal } from "@/components/modals/AdModal"
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal"
import { Button } from "@/components/ui/button"
import { useAds, useDeleteAd } from "@/hooks/queries/useAds"
import { getFileUrl, cn } from "@/lib/utils"
import { AD_PAGE_OPTIONS } from "@/schemas/ad.schema"
import type { Ad } from "@/types"

function pageLabels(pages: string[]): string {
  if (!pages || pages.length === 0) return "—"
  return pages
    .map((p) => AD_PAGE_OPTIONS.find((o) => o.value === p)?.label ?? p)
    .join(", ")
}

function formatDate(date: string | null) {
  if (!date) return null
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function AdsTable() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [deletingAd, setDeletingAd] = useState<Ad | null>(null)

  const { data: ads = [], isLoading } = useAds()
  const deleteMutation = useDeleteAd()

  const columns: ColumnDef<Ad>[] = [
    {
      id: "image",
      header: "",
      cell: ({ row }) =>
        row.original.image_path ? (
          <img
            src={getFileUrl(row.original.image_path)}
            alt={row.original.title}
            loading="lazy"
            className="h-10 w-16 rounded-lg object-cover border border-zinc-100"
          />
        ) : (
          <div className="h-10 w-16 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-300 text-xs">
            —
          </div>
        ),
    },
    {
      accessorKey: "title",
      header: "Title",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium text-zinc-900 line-clamp-1">{row.original.title}</span>
      ),
    },
    {
      id: "target_pages",
      header: "Pages",
      cell: ({ row }) => (
        <span className="text-xs text-zinc-600">{pageLabels(row.original.target_pages)}</span>
      ),
    },
    {
      id: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            row.original.is_active
              ? "bg-green-50 text-green-700"
              : "bg-zinc-100 text-zinc-500"
          )}
        >
          {row.original.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "date_range",
      header: "Date Range",
      cell: ({ row }) => {
        const start = formatDate(row.original.starts_at)
        const end = formatDate(row.original.ends_at)
        if (!start && !end) return <span className="text-zinc-300">—</span>
        return (
          <span className="text-sm text-zinc-600">
            {start ?? "—"} → {end ?? "—"}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setEditingAd(row.original)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => setDeletingAd(row.original)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Create Ad
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={ads}
        isLoading={isLoading} emptyMessage="No ads yet."
      />

      <AdModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => setCreateOpen(false)}
      />

      <AdModal
        open={!!editingAd}
        onClose={() => setEditingAd(null)}
        ad={editingAd}
        onSuccess={() => setEditingAd(null)}
      />

      <DeleteConfirmModal
        open={!!deletingAd}
        onClose={() => setDeletingAd(null)}
        onConfirm={() => {
          if (!deletingAd) return
          deleteMutation.mutate(deletingAd.id, {
            onSuccess: () => setDeletingAd(null),
          })
        }}
        title={`Delete "${deletingAd?.title ?? ""}"`}
        message={`Are you sure you want to delete "${deletingAd?.title}"? This cannot be undone.`}
        isPending={deleteMutation.isPending}
      />
    </>
  )
}
