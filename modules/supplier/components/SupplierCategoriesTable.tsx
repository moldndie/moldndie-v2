"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/DataTable"
import { Button } from "@/components/ui/button"
import { SupplierCategoryModal } from "@/components/modals/SupplierCategoryModal"
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal"
import {
  getSupplierCategories,
  createSupplierCategory,
  updateSupplierCategory,
  deleteSupplierCategory,
} from "@/services/supplierCategory.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import type { SupplierCategory } from "@/types"
import type { SupplierCategoryFormValues } from "@/schemas/supplier.schema"

export function SupplierCategoriesTable() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<SupplierCategory | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<SupplierCategory | null>(null)

  const { data = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.SUPPLIER_CATEGORIES,
    queryFn: getSupplierCategories,
  })

  const createMutation = useMutation({
    mutationFn: (values: SupplierCategoryFormValues) => createSupplierCategory(values),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.SUPPLIER_CATEGORIES })
      const prev = queryClient.getQueryData<SupplierCategory[]>(QUERY_KEYS.SUPPLIER_CATEGORIES)
      queryClient.setQueryData<SupplierCategory[]>(QUERY_KEYS.SUPPLIER_CATEGORIES, (old = []) => [
        ...old,
        { id: `temp-${Date.now()}`, ...values, created_at: new Date().toISOString() },
      ])
      return { prev }
    },
    onError: (e: Error, _, ctx) => {
      queryClient.setQueryData(QUERY_KEYS.SUPPLIER_CATEGORIES, ctx?.prev)
      toast.error(e.message || "Create failed.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUPPLIER_CATEGORIES })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: SupplierCategoryFormValues }) =>
      updateSupplierCategory(id, values),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.SUPPLIER_CATEGORIES })
      const prev = queryClient.getQueryData<SupplierCategory[]>(QUERY_KEYS.SUPPLIER_CATEGORIES)
      queryClient.setQueryData<SupplierCategory[]>(QUERY_KEYS.SUPPLIER_CATEGORIES, (old = []) =>
        old.map((c) => (c.id === id ? { ...c, ...values } : c))
      )
      return { prev }
    },
    onError: (e: Error, _, ctx) => {
      queryClient.setQueryData(QUERY_KEYS.SUPPLIER_CATEGORIES, ctx?.prev)
      toast.error(e.message || "Update failed.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUPPLIER_CATEGORIES })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSupplierCategory(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.SUPPLIER_CATEGORIES })
      const prev = queryClient.getQueryData<SupplierCategory[]>(QUERY_KEYS.SUPPLIER_CATEGORIES)
      queryClient.setQueryData<SupplierCategory[]>(QUERY_KEYS.SUPPLIER_CATEGORIES, (old = []) =>
        old.filter((c) => c.id !== id)
      )
      return { prev }
    },
    onError: (e: Error, _, ctx) => {
      queryClient.setQueryData(QUERY_KEYS.SUPPLIER_CATEGORIES, ctx?.prev)
      toast.error(e.message || "Delete failed.")
    },
    onSuccess: () => {
      toast.success("Category deleted.")
      setDeletingCategory(null)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUPPLIER_CATEGORIES })
    },
  })

  const columns: ColumnDef<SupplierCategory>[] = [
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium text-zinc-900">{row.original.name}</span>
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

      <SupplierCategoryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={(values) => createMutation.mutateAsync(values)}
        onSuccess={() => setCreateOpen(false)}
      />

      <SupplierCategoryModal
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
