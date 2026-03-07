"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { Button } from "@/components/ui/button"
import { TagModal } from "@/components/modals/TagModal"
import { deleteTag } from "@/services/blogTag.service"
import type { BlogTag } from "@/types"

interface TagsTableProps {
  data: BlogTag[]
}

export function TagsTable({ data }: TagsTableProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    setDeleteError(null)
    try {
      await deleteTag(id)
      router.refresh()
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeletingId(null)
    }
  }

  const columns: ColumnDef<BlogTag>[] = [
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium text-zinc-900">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zinc-500">{row.original.slug}</span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created At",
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
            onClick={() => setEditingTag(row.original)}
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
      {deleteError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {deleteError}
        </div>
      )}

      <div className="flex items-center justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Create Tag
        </Button>
      </div>

      <DataTable columns={columns} data={data} emptyMessage="No tags yet." />

      <TagModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false)
          router.refresh()
        }}
      />
      <TagModal
        open={!!editingTag}
        onClose={() => setEditingTag(null)}
        tag={editingTag}
        onSuccess={() => {
          setEditingTag(null)
          router.refresh()
        }}
      />
    </>
  )
}
