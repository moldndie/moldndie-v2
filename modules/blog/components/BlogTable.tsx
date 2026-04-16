"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus, BarChart2, Eye, Globe, EyeOff } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { Button } from "@/components/ui/button"
import { useBlogs, useDeleteBlog, useSetBlogPublished } from "@/hooks/queries/useBlog"
import { EngagementModal } from "./EngagementModal"
import type { Blog } from "@/types"

export function BlogTable() {
  const router = useRouter()
  const { data = [], isLoading } = useBlogs()
  const deleteMutation = useDeleteBlog()
  const publishMutation = useSetBlogPublished()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [engagementBlog, setEngagementBlog] = useState<Blog | null>(null)

  async function handleDelete(id: string) {
    if (!confirm("Delete this blog post? This cannot be undone.")) return
    setDeletingId(id)
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleTogglePublish(id: string, currentlyPublished: boolean) {
    setTogglingId(id)
    try {
      await publishMutation.mutateAsync({ id, published: !currentlyPublished })
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update status")
    } finally {
      setTogglingId(null)
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
      accessorKey: "is_published",
      header: "Status",
      enableSorting: true,
      cell: ({ row }) =>
        row.original.is_published ? (
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
      cell: ({ row }) => {
        const blog = row.original
        const isToggling = togglingId === blog.id

        return (
          <div className="flex items-center justify-end gap-1">
            {/* Analytics */}
            <button
              onClick={() => setEngagementBlog(blog)}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              title="View engagement"
            >
              <BarChart2 className="size-3.5" />
            </button>

            {/* Preview — opens full frontend preview in new tab */}
            <button
              onClick={() => window.open(`/blogs/preview/${blog.id}`, "_blank")}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              title="Preview"
            >
              <Eye className="size-3.5" />
            </button>

            {/* Edit */}
            <button
              onClick={() => router.push(`/dashboard/blogs/${blog.id}/edit`)}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              title="Edit"
            >
              <Pencil className="size-3.5" />
            </button>

            {/* Publish / Unpublish */}
            <button
              onClick={() => handleTogglePublish(blog.id, blog.is_published)}
              disabled={isToggling}
              className={[
                "rounded-md p-1.5 transition-colors disabled:opacity-40",
                blog.is_published
                  ? "text-green-600 hover:bg-red-50 hover:text-red-600"
                  : "text-zinc-400 hover:bg-green-50 hover:text-green-600",
              ].join(" ")}
              title={blog.is_published ? "Unpublish" : "Publish"}
            >
              {blog.is_published
                ? <Globe className="size-3.5" />
                : <EyeOff className="size-3.5" />}
            </button>

            {/* Delete */}
            <button
              onClick={() => handleDelete(blog.id)}
              disabled={deletingId === blog.id}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
              title="Delete"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )
      },
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
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No blog posts yet."
      />

      <EngagementModal
        open={!!engagementBlog}
        blogId={engagementBlog?.id ?? ""}
        blogTitle={engagementBlog?.title ?? ""}
        onClose={() => setEngagementBlog(null)}
      />
    </>
  )
}
