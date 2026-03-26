"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/DataTable"
import { Button } from "@/components/ui/button"
import { MoldCategoryModal } from "@/components/modals/MoldCategoryModal"
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal"
import {
  getMoldCategories,
  createMoldCategory,
  updateMoldCategory,
  deleteMoldCategory,
} from "@/services/moldCategory.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import type { MoldCategory } from "@/types"
import type { MoldCategoryFormValues } from "@/schemas/moldCategory.schema"

export function MoldCategoriesTable() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MoldCategory | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<MoldCategory | null>(null)

  const { data = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.MOLD_CATEGORIES,
    queryFn: getMoldCategories,
  })

  const createMutation = useMutation({
    mutationFn: (values: MoldCategoryFormValues) => createMoldCategory(values),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.MOLD_CATEGORIES })
      const prev = queryClient.getQueryData<MoldCategory[]>(QUERY_KEYS.MOLD_CATEGORIES)
      queryClient.setQueryData<MoldCategory[]>(QUERY_KEYS.MOLD_CATEGORIES, (old = []) => [
        ...old,
        { id: `temp-${Date.now()}`, ...values, created_at: new Date().toISOString() },
      ])
      return { prev }
    },
    onError: (e: Error, _, ctx) => {
      queryClient.setQueryData(QUERY_KEYS.MOLD_CATEGORIES, ctx?.prev)
      toast.error(e.message || "Create failed.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MOLD_CATEGORIES })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: MoldCategoryFormValues }) =>
      updateMoldCategory(id, values),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.MOLD_CATEGORIES })
      const prev = queryClient.getQueryData<MoldCategory[]>(QUERY_KEYS.MOLD_CATEGORIES)
      queryClient.setQueryData<MoldCategory[]>(QUERY_KEYS.MOLD_CATEGORIES, (old = []) =>
        old.map((c) => (c.id === id ? { ...c, ...values } : c))
      )
      return { prev }
    },
    onError: (e: Error, _, ctx) => {
      queryClient.setQueryData(QUERY_KEYS.MOLD_CATEGORIES, ctx?.prev)
      toast.error(e.message || "Update failed.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MOLD_CATEGORIES })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMoldCategory(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.MOLD_CATEGORIES })
      const prev = queryClient.getQueryData<MoldCategory[]>(QUERY_KEYS.MOLD_CATEGORIES)
      queryClient.setQueryData<MoldCategory[]>(QUERY_KEYS.MOLD_CATEGORIES, (old = []) =>
        old.filter((c) => c.id !== id)
      )
      return { prev }
    },
    onError: (e: Error, _, ctx) => {
      queryClient.setQueryData(QUERY_KEYS.MOLD_CATEGORIES, ctx?.prev)
      toast.error(e.message || "Delete failed.")
    },
    onSuccess: () => {
      toast.success("Category deleted.")
      setDeletingCategory(null)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MOLD_CATEGORIES })
    },
  })

  const columns: ColumnDef<MoldCategory>[] = [
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
            onClick={() => setEditingCategory(row.original)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => setDeletingCategory(row.original)}
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
          Create Category
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        emptyMessage={isLoading ? "Loading…" : "No categories yet."}
      />

      <MoldCategoryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={(values) => createMutation.mutateAsync(values)}
        onSuccess={() => setCreateOpen(false)}
      />

      <MoldCategoryModal
        open={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        category={editingCategory}
        onSave={(values) => updateMutation.mutateAsync({ id: editingCategory!.id, values })}
        onSuccess={() => setEditingCategory(null)}
      />

      <DeleteConfirmModal
        open={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={() => deletingCategory && deleteMutation.mutate(deletingCategory.id)}
        isPending={deleteMutation.isPending}
        message={
          deletingCategory
            ? `Are you sure you want to delete "${deletingCategory.name}"? This cannot be undone.`
            : undefined
        }
      />
    </>
  )
}
