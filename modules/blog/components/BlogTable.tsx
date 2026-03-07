"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { Button } from "@/components/ui/button"
import { deleteBlog } from "@/services/blog.service"
import type { Blog } from "@/types"

interface BlogTableProps {
  data: Blog[]
}

export function BlogTable({ data }: BlogTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm("Delete this blog post? This cannot be undone.")) return
    setDeletingId(id)
    try {
      await deleteBlog(id)
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeletingId(null)
    }
  }

  const columns: ColumnDef<Blog>[] = [
    {
      accessorKey: "title",
      header: "Title",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium text-zinc-900 line-clamp-1">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zinc-500">{row.original.slug}</span>
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
      accessorKey: "published",
      header: "Status",
      enableSorting: true,
      cell: ({ row }) =>
        row.original.published ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Published
          </span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
            Draft
          </span>
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
            onClick={() => router.push(`/dashboard/blogs/${row.original.id}/edit`)}
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
        <Button onClick={() => router.push("/dashboard/blogs/create")}>
          <Plus className="size-4" />
          Create Blog
        </Button>
      </div>
      <DataTable columns={columns} data={data} emptyMessage="No blog posts yet." />
    </>
  )
}
