"use client"

import { useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import { DataTable } from "./DataTable"
import { EventModal } from "@/components/modals/EventModal"
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal"
import { Button } from "@/components/ui/button"
import { useEvents, useEventCategories, useDeleteEvent } from "@/hooks/queries/useEvents"
import { getFileUrl } from "@/lib/utils"
import type { Event } from "@/types"

export function EventsTable() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null)

  const { data: events = [], isLoading } = useEvents()
  const { data: categories = [] } = useEventCategories()
  const deleteMutation = useDeleteEvent()

  const columns: ColumnDef<Event>[] = [
    {
      id: "image",
      header: "",
      cell: ({ row }) =>
        row.original.image_path ? (
          <img
            src={getFileUrl(row.original.image_path)}
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
      accessorKey: "event_date",
      header: "Date",
      enableSorting: true,
      cell: ({ row }) =>
        row.original.event_date
          ? new Date(row.original.event_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : <span className="text-zinc-300">—</span>,
    },
    {
      id: "country",
      header: "Country",
      cell: ({ row }) =>
        row.original.country ? (
          <span className="text-zinc-600 text-sm">{row.original.country}</span>
        ) : (
          <span className="text-zinc-300">—</span>
        ),
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => {
        const cat = categories.find((c) => c.id === row.original.category_id)
        return cat ? (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
            {cat.name}
          </span>
        ) : (
          <span className="text-zinc-300">—</span>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setEditingEvent(row.original)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => setDeletingEvent(row.original)}
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
        <Button onClick={() => setCreateOpen(true)}>Create Event</Button>
      </div>

      <DataTable
        columns={columns}
        data={events}
        emptyMessage={isLoading ? "Loading…" : "No events yet."}
      />

      <EventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => setCreateOpen(false)}
      />

      <EventModal
        open={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        event={editingEvent}
        onSuccess={() => setEditingEvent(null)}
      />

      <DeleteConfirmModal
        open={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        onConfirm={() => {
          if (!deletingEvent) return
          deleteMutation.mutate(deletingEvent.id, {
            onSuccess: () => setDeletingEvent(null),
          })
        }}
        title={`Delete "${deletingEvent?.title ?? ""}"`}
        message={`Are you sure you want to delete "${deletingEvent?.title}"? This cannot be undone.`}
        isPending={deleteMutation.isPending}
      />
    </>
  )
}
