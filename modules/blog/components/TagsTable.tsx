"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/DataTable"
import { Button } from "@/components/ui/button"
import { TagModal } from "@/components/modals/TagModal"
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal"
import { getTags, createTag, updateTag, deleteTag } from "@/services/blogTag.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import type { BlogTag } from "@/types"
import type { BlogTagFormValues } from "@/schemas/blogTag.schema"

export function TagsTable() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null)
  const [deletingTag, setDeletingTag] = useState<BlogTag | null>(null)

  const { data = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.BLOG_TAGS,
    queryFn: getTags,
  })

  const createMutation = useMutation({
    mutationFn: (values: BlogTagFormValues) => createTag(values),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.BLOG_TAGS })
      const prev = queryClient.getQueryData<BlogTag[]>(QUERY_KEYS.BLOG_TAGS)
      queryClient.setQueryData<BlogTag[]>(QUERY_KEYS.BLOG_TAGS, (old = []) => [
        ...old,
        { id: `temp-${Date.now()}`, ...values, created_at: new Date().toISOString() },
      ])
      return { prev }
    },
    onError: (e: Error, _, ctx) => {
      queryClient.setQueryData(QUERY_KEYS.BLOG_TAGS, ctx?.prev)
      toast.error(e.message || "Create failed.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BLOG_TAGS })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: BlogTagFormValues }) =>
      updateTag(id, values),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.BLOG_TAGS })
      const prev = queryClient.getQueryData<BlogTag[]>(QUERY_KEYS.BLOG_TAGS)
      queryClient.setQueryData<BlogTag[]>(QUERY_KEYS.BLOG_TAGS, (old = []) =>
        old.map((t) => (t.id === id ? { ...t, ...values } : t))
      )
      return { prev }
    },
    onError: (e: Error, _, ctx) => {
      queryClient.setQueryData(QUERY_KEYS.BLOG_TAGS, ctx?.prev)
      toast.error(e.message || "Update failed.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BLOG_TAGS })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.BLOG_TAGS })
      const prev = queryClient.getQueryData<BlogTag[]>(QUERY_KEYS.BLOG_TAGS)
      queryClient.setQueryData<BlogTag[]>(QUERY_KEYS.BLOG_TAGS, (old = []) =>
        old.filter((t) => t.id !== id)
      )
      return { prev }
    },
    onError: (e: Error, _, ctx) => {
      queryClient.setQueryData(QUERY_KEYS.BLOG_TAGS, ctx?.prev)
      toast.error(e.message || "Delete failed.")
    },
    onSuccess: () => {
      toast.success("Tag deleted.")
      setDeletingTag(null)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BLOG_TAGS })
    },
  })

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
            onClick={() => setDeletingTag(row.original)}
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
          Create Tag
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading} emptyMessage="No tags yet."
      />

      <TagModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={(values) => createMutation.mutateAsync(values)}
        onSuccess={() => setCreateOpen(false)}
      />

      <TagModal
        open={!!editingTag}
        onClose={() => setEditingTag(null)}
        tag={editingTag}
        onSave={(values) => updateMutation.mutateAsync({ id: editingTag!.id, values })}
        onSuccess={() => setEditingTag(null)}
      />

      <DeleteConfirmModal
        open={!!deletingTag}
        onClose={() => setDeletingTag(null)}
        onConfirm={() => deletingTag && deleteMutation.mutate(deletingTag.id)}
        isPending={deleteMutation.isPending}
        message={
          deletingTag
            ? `Are you sure you want to delete "${deletingTag.name}"? This cannot be undone.`
            : undefined
        }
      />
    </>
  )
}
