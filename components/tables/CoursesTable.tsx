"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import { DataTable } from "./DataTable"
import { CourseModal } from "@/components/modals/CourseModal"
import { Button } from "@/components/ui/button"
import { deleteCourse } from "@/services/course.service"
import type { Course } from "@/types"

interface CoursesTableProps {
  data: Course[]
}

export function CoursesTable({ data }: CoursesTableProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm("Delete this course? This cannot be undone.")) return
    setDeletingId(id)
    try {
      await deleteCourse(id)
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeletingId(null)
    }
  }

  const columns: ColumnDef<Course>[] = [
    {
      id: "thumbnail",
      header: "",
      cell: ({ row }) =>
        row.original.thumbnail ? (
          <img
            src={row.original.thumbnail}
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
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="line-clamp-1 text-zinc-500 text-sm">
          {row.original.description ?? "—"}
        </span>
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
            onClick={() => setEditingCourse(row.original)}
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
        <Button onClick={() => setCreateOpen(true)}>Create Course</Button>
      </div>

      <DataTable columns={columns} data={data} emptyMessage="No courses yet." />

      <CourseModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => router.refresh()}
      />
      <CourseModal
        open={!!editingCourse}
        onClose={() => setEditingCourse(null)}
        course={editingCourse}
        onSuccess={() => {
          setEditingCourse(null)
          router.refresh()
        }}
      />
    </>
  )
}
