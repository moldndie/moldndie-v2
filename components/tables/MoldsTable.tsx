"use client"

import { useState, useEffect } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Search } from "lucide-react"
import { Select } from "@/components/ui/select"
import { DataTable } from "./DataTable"
import { MoldModal } from "@/components/modals/MoldModal"
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal"
import { Button } from "@/components/ui/button"
import { useMolds, useMoldCategories, useDeleteMold, type MoldsParams } from "@/hooks/queries/useMolds"
import { getFileUrl } from "@/lib/utils"
import type { Mold } from "@/types"

type FilterType = "all" | "free" | "paid"

export function MoldsTable() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editingMold, setEditingMold] = useState<Mold | null>(null)
  const [deletingMold, setDeletingMold] = useState<Mold | null>(null)

  // Debounce search — 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400)
    return () => clearTimeout(t)
  }, [search])

  const params: MoldsParams = {
    search: debouncedSearch || undefined,
    filter: filter === "all" ? undefined : filter,
  }

  const { data: molds = [], isLoading } = useMolds(params)
  const { data: categories = [] } = useMoldCategories()
  const deleteMutation = useDeleteMold()

  const columns: ColumnDef<Mold>[] = [
    {
      id: "preview",
      header: "",
      cell: ({ row }) =>
        row.original.preview_image ? (
          <img
            src={getFileUrl(row.original.preview_image!)}
            alt={row.original.title}
            loading="lazy"
            className="size-10 rounded-lg object-cover border border-zinc-100"
          />
        ) : (
          <div className="size-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-300 text-xs">
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
      id: "category",
      header: "Category",
      cell: ({ row }) => {
        const cat = categories.find((c) => c.id === row.original.category_id)
        return cat ? (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
            {cat.name}
          </span>
        ) : (
          <span className="text-zinc-300">—</span>
        )
      },
    },
    {
      accessorKey: "price",
      header: "Price",
      enableSorting: true,
      cell: ({ row }) => {
        const price = row.original.price
        if (price === null || price === 0) {
          return <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Free</span>
        }
        return <span className="text-zinc-700">{price.toFixed(2)} EGP</span>
      },
    },
    {
      id: "file",
      header: "File",
      cell: ({ row }) =>
        row.original.file_key ? (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">Uploaded</span>
        ) : (
          <span className="text-zinc-300 text-xs">—</span>
        ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      enableSorting: true,
      cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setEditingMold(row.original)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => setDeletingMold(row.original)}
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
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search molds…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300 transition"
          />
        </div>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
        >
          <option value="all">All</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </Select>
        <div className="ml-auto">
          <Button onClick={() => setCreateOpen(true)}>Create Tooling</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={molds}
        isLoading={isLoading} emptyMessage="No toolings found."
      />

      <MoldModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        categories={categories}
        onSuccess={() => setCreateOpen(false)}
      />

      <MoldModal
        open={!!editingMold}
        onClose={() => setEditingMold(null)}
        mold={editingMold}
        categories={categories}
        onSuccess={() => setEditingMold(null)}
      />

      <DeleteConfirmModal
        open={!!deletingMold}
        onClose={() => setDeletingMold(null)}
        onConfirm={() => {
          if (!deletingMold) return
          deleteMutation.mutate(deletingMold.id, {
            onSuccess: () => setDeletingMold(null),
          })
        }}
        title={`Delete "${deletingMold?.title ?? ""}"`}
        message={`Are you sure you want to delete "${deletingMold?.title}"? This cannot be undone.`}
        isPending={deleteMutation.isPending}
      />
    </>
  )
}
