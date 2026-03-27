"use client"

import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { Button } from "@/components/ui/button"
import { useAds, useDeleteAd } from "@/hooks/queries/useAds"
import { AD_TARGET_LABELS } from "@/schemas/ad.schema"
import type { Ad } from "@/types"

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function AdsTable() {
  const router = useRouter()
  const { data = [], isLoading } = useAds()
  const deleteMutation = useDeleteAd()

  async function handleDelete(id: string) {
    if (!confirm("Delete this ad? This cannot be undone.")) return
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed")
    }
  }

  const columns: ColumnDef<Ad>[] = [
    {
      accessorKey: "title",
      header: "Title",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium text-zinc-900 line-clamp-1">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "target_type",
      header: "Placement",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
          {AD_TARGET_LABELS[row.original.target_type] ?? row.original.target_type}
        </span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      enableSorting: true,
      cell: ({ row }) =>
        row.original.is_active ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">Inactive</span>
        ),
    },
    {
      accessorKey: "starts_at",
      header: "Starts",
      cell: ({ row }) => <span className="text-xs text-zinc-500">{formatDate(row.original.starts_at)}</span>,
    },
    {
      accessorKey: "ends_at",
      header: "Ends",
      cell: ({ row }) => <span className="text-xs text-zinc-500">{formatDate(row.original.ends_at)}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => router.push(`/dashboard/ads/${row.original.id}/edit`)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            disabled={deleteMutation.isPending}
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
        <Button onClick={() => router.push("/dashboard/ads/create")}>
          <Plus className="size-4" />
          Create Ad
        </Button>
      </div>
      <DataTable columns={columns} data={data} isLoading={isLoading} emptyMessage="No ads yet." />
    </>
  )
}
