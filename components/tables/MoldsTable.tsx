"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import { DataTable } from "./DataTable"
import { MoldModal } from "@/components/modals/MoldModal"
import { Button } from "@/components/ui/button"
import { deleteMold } from "@/services/mold.service"
import type { Mold, MoldCategory } from "@/types"

interface MoldsTableProps {
  data: Mold[]
  categories: MoldCategory[]
}

export function MoldsTable({ data, categories }: MoldsTableProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingMold, setEditingMold] = useState<Mold | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm("Delete this mold? This cannot be undone.")) return
    setDeletingId(id)
    try {
      await deleteMold(id)
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeletingId(null)
    }
  }

  const columns: ColumnDef<Mold>[] = [
    {
      id: "preview",
      header: "",
      cell: ({ row }) =>
        row.original.preview_image ? (
          <img
            src={row.original.preview_image}
            alt={row.original.title}
            className="size-10 rounded-lg object-cover border border-zinc-100"
          />
        ) : (
          <div className="size-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-300 text-xs">
            No img
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
      cell: ({ row }) =>
        row.original.category ? (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
            {row.original.category.name}
          </span>
        ) : (
          <span className="text-zinc-300">—</span>
        ),
    },
    {
      accessorKey: "price",
      header: "Price",
      enableSorting: true,
      cell: ({ row }) =>
        row.original.price != null
          ? `$${row.original.price.toFixed(2)}`
          : <span className="text-zinc-300">Free</span>,
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
            onClick={() => handleDelete(row.original.id)}
            disabled={deletingId === row.original.id}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
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
        <Button onClick={() => setCreateOpen(true)}>Create Mold</Button>
      </div>

      <DataTable columns={columns} data={data} emptyMessage="No molds yet." />

      <MoldModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        categories={categories}
        onSuccess={() => router.refresh()}
      />
      <MoldModal
        open={!!editingMold}
        onClose={() => setEditingMold(null)}
        mold={editingMold}
        categories={categories}
        onSuccess={() => {
          setEditingMold(null)
          router.refresh()
        }}
      />
    </>
  )
}
