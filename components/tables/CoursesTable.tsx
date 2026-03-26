"use client"

import { useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import { DataTable } from "./DataTable"
import { CourseModal } from "@/components/modals/CourseModal"
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal"
import { Button } from "@/components/ui/button"
import { useCourses, useDeleteCourse } from "@/hooks/queries/useCourses"
import { getFileUrl } from "@/lib/utils"
import type { Course } from "@/types"

export function CoursesTable() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null)

  const { data: courses = [], isLoading } = useCourses()
  const deleteMutation = useDeleteCourse()

  const columns: ColumnDef<Course>[] = [
    {
      id: "thumbnail",
      header: "",
      cell: ({ row }) =>
        row.original.thumbnail ? (
          <img
            src={getFileUrl(row.original.thumbnail)}
            alt={row.original.title}
            className="size-10 rounded-lg object-cover border border-zinc-100"
          />
        ) : (
          <div className="size-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-300 text-xs">
            —
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
      accessorKey: "price",
      header: "Price",
      enableSorting: true,
      cell: ({ row }) => {
        const price = row.original.price
        if (price === null || price === 0) {
          return <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Free</span>
        }
        return <span className="text-zinc-700">${price.toFixed(2)}</span>
      },
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
            onClick={() => setDeletingCourse(row.original)}
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
        <Button onClick={() => setCreateOpen(true)}>Create Course</Button>
      </div>

      <DataTable
        columns={columns}
        data={courses}
        emptyMessage={isLoading ? "Loading…" : "No courses yet."}
      />

      <CourseModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => setCreateOpen(false)}
      />

      <CourseModal
        open={!!editingCourse}
        onClose={() => setEditingCourse(null)}
        course={editingCourse}
        onSuccess={() => setEditingCourse(null)}
      />

      <DeleteConfirmModal
        open={!!deletingCourse}
        onClose={() => setDeletingCourse(null)}
        onConfirm={() => {
          if (!deletingCourse) return
          deleteMutation.mutate(deletingCourse.id, {
            onSuccess: () => setDeletingCourse(null),
          })
        }}
        title={`Delete "${deletingCourse?.title ?? ""}"`}
        message={`Are you sure you want to delete "${deletingCourse?.title}"? This cannot be undone.`}
        isPending={deleteMutation.isPending}
      />
    </>
  )
}
