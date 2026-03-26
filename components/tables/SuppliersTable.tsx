"use client"

import { useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus } from "lucide-react"
import { DataTable } from "./DataTable"
import { SupplierModal } from "@/components/modals/SupplierModal"
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal"
import { Button } from "@/components/ui/button"
import { useSuppliers, useSupplierCategories, useDeleteSupplier } from "@/hooks/queries/useSuppliers"
import { getFileUrl } from "@/lib/utils"
import type { Supplier } from "@/types"

export function SuppliersTable() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)

  const { data: suppliers = [], isLoading } = useSuppliers()
  const { data: categories = [] } = useSupplierCategories()
  const deleteMutation = useDeleteSupplier()

  const columns: ColumnDef<Supplier>[] = [
    {
      id: "logo",
      header: "",
      cell: ({ row }) =>
        row.original.logo_path ? (
          <img
            src={getFileUrl(row.original.logo_path)}
            alt={row.original.name}
            className="size-10 rounded-lg object-cover border border-zinc-100"
          />
        ) : (
          <div className="size-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-300 text-xs">
            —
          </div>
        ),
    },
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium text-zinc-900">{row.original.name}</span>
      ),
    },
    {
      id: "website",
      header: "Website",
      cell: ({ row }) =>
        row.original.website ? (
          <a
            href={row.original.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline truncate max-w-[160px] block"
          >
            {row.original.website.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          <span className="text-zinc-300">—</span>
        ),
    },
    {
      id: "country",
      header: "Country",
      cell: ({ row }) =>
        row.original.country ? (
          <span className="text-zinc-600 text-sm">{row.original.country}</span>
        ) : (
          <span className="text-zinc-300">—</span>
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
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setEditingSupplier(row.original)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => setDeletingSupplier(row.original)}
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
          Create Supplier
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        emptyMessage={isLoading ? "Loading…" : "No suppliers yet."}
      />

      <SupplierModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => setCreateOpen(false)}
      />

      <SupplierModal
        open={!!editingSupplier}
        onClose={() => setEditingSupplier(null)}
        supplier={editingSupplier}
        onSuccess={() => setEditingSupplier(null)}
      />

      <DeleteConfirmModal
        open={!!deletingSupplier}
        onClose={() => setDeletingSupplier(null)}
        onConfirm={() => {
          if (!deletingSupplier) return
          deleteMutation.mutate(deletingSupplier.id, {
            onSuccess: () => setDeletingSupplier(null),
          })
        }}
        title={`Delete "${deletingSupplier?.name ?? ""}"`}
        message={`Are you sure you want to delete "${deletingSupplier?.name}"? This cannot be undone.`}
        isPending={deleteMutation.isPending}
      />
    </>
  )
}
