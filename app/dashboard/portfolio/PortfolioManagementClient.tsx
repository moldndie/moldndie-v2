"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, Loader2,
} from "lucide-react"
import {
  getPortfolioItems,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  togglePortfolioItemActive,
  updatePortfolioItemOrder,
  type PortfolioItem,
  type PortfolioItemFormValues,
} from "@/services/portfolio.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import { Modal } from "@/components/ui/modal"
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal"
import { CroppableFileUploadField } from "@/components/forms/CroppableFileUploadField"
import { FileUploadField } from "@/components/forms/FileUploadField"
import { FilePreview } from "@/components/forms/FilePreview"
import RichTextEditor from "@/components/editor/RichTextEditor"
import { toDoc, fromDoc } from "@/lib/richtext"

const EMPTY_FORM: PortfolioItemFormValues = {
  title: "",
  description: "",
  images: [],
  video_path: "",
  video_url: "",
  sort_order: 0,
  is_active: true,
}

const inputCls =
  "w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
const labelCls = "block text-xs font-semibold text-zinc-700 mb-1"

// ── Form ─────────────────────────────────────────────────────────────────────

function PortfolioForm({
  initial,
  formKey,
  onSave,
  isPending,
  error,
}: {
  initial: PortfolioItemFormValues
  /** Changes whenever a different item is loaded — remounts the editor/uploads */
  formKey: string
  onSave: (values: PortfolioItemFormValues) => void
  isPending: boolean
  error: string | null
}) {
  const [form, setForm] = useState<PortfolioItemFormValues>(initial)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setForm(initial)
  }, [initial])

  function set<K extends keyof PortfolioItemFormValues>(key: K, value: PortfolioItemFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const images = form.images ?? []

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Title *</label>
        <input
          required
          className={inputCls}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. 8-cavity hot runner mold for automotive clips"
        />
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <RichTextEditor
          key={formKey}
          value={toDoc(form.description)}
          onChange={(v) => set("description", fromDoc(v))}
          placeholder="What the project involved, materials, tolerances, outcome…"
          minHeight={180}
        />
      </div>

      {/* Images — repeatable gallery */}
      <div>
        <label className={labelCls}>Images</label>
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            {images.map((key, i) => (
              <FilePreview
                key={`${key}-${i}`}
                value={key}
                onClear={() => set("images", images.filter((_, j) => j !== i))}
              />
            ))}
          </div>
        )}
        <CroppableFileUploadField
          key={`${formKey}-img-${images.length}`}
          folder="portfolio/images"
          aspect={4 / 3}
          label="Click to add an image (4:3)"
          onUploadSuccess={({ key }) => set("images", [...images, key])}
          onUploadingChange={setUploading}
        />
        <p className="text-xs text-zinc-400 mt-1">
          Add as many as you like — each upload is appended to the gallery.
        </p>
      </div>

      <div>
        <label className={labelCls}>Video file</label>
        <FileUploadField
          key={`${formKey}-video`}
          folder="portfolio/videos"
          accept="video/*"
          label="Click to upload a video"
          existingValue={form.video_path || null}
          onUploadSuccess={({ key }) => set("video_path", key)}
          onClear={() => set("video_path", "")}
          onUploadingChange={setUploading}
        />
      </div>

      <div>
        <label className={labelCls}>Video link</label>
        <input
          className={inputCls}
          value={form.video_url ?? ""}
          onChange={(e) => set("video_url", e.target.value)}
          placeholder="https://youtube.com/watch?v=…"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => set("is_active", e.target.checked)}
          className="rounded border-zinc-300"
        />
        <span className="text-sm text-zinc-700">Active (visible on the Services page)</span>
      </label>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || uploading}
        className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
      >
        {(isPending || uploading) && <Loader2 size={14} className="animate-spin" />}
        {uploading ? "Uploading…" : isPending ? "Saving…" : "Save Item"}
      </button>
    </form>
  )
}

// ── Main Client ──────────────────────────────────────────────────────────────

export default function PortfolioManagementClient() {
  const qc = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<PortfolioItem | null>(null)
  const [deleting, setDeleting] = useState<PortfolioItem | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.PORTFOLIO,
    queryFn: getPortfolioItems,
    staleTime: 2 * 60 * 1000,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: QUERY_KEYS.PORTFOLIO })

  const createMut = useMutation({
    mutationFn: createPortfolioItem,
    onSuccess: () => { setCreateOpen(false); setFormError(null); invalidate() },
    onError: (e) => setFormError(e instanceof Error ? e.message : "Failed to create."),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, values }: { id: string; values: PortfolioItemFormValues }) =>
      updatePortfolioItem(id, values),
    onSuccess: () => { setEditing(null); setFormError(null); invalidate() },
    onError: (e) => setFormError(e instanceof Error ? e.message : "Failed to update."),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      togglePortfolioItemActive(id, is_active),
    onSuccess: invalidate,
  })

  const orderMut = useMutation({
    mutationFn: ({ id, sort_order }: { id: string; sort_order: number }) =>
      updatePortfolioItemOrder(id, sort_order),
    onSuccess: invalidate,
  })

  const deleteMut = useMutation({
    mutationFn: deletePortfolioItem,
    onSuccess: () => { setDeleting(null); invalidate() },
    onError: (e) => alert(e instanceof Error ? e.message : "Failed to delete."),
  })

  function move(item: PortfolioItem, idx: number, dir: -1 | 1) {
    const other = items[idx + dir]
    if (!other) return
    orderMut.mutate({ id: item.id, sort_order: other.sort_order })
    orderMut.mutate({ id: other.id, sort_order: item.sort_order })
  }

  const maxOrder = items.reduce((acc, s) => Math.max(acc, s.sort_order), 0)

  const createInitial: PortfolioItemFormValues = { ...EMPTY_FORM, sort_order: maxOrder + 1 }

  const editInitial: PortfolioItemFormValues = editing
    ? {
        title:       editing.title,
        description: editing.description ?? "",
        images:      editing.images ?? [],
        video_path:  editing.video_path ?? "",
        video_url:   editing.video_url ?? "",
        sort_order:  editing.sort_order,
        is_active:   editing.is_active,
      }
    : EMPTY_FORM

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => { setFormError(null); setCreateOpen(true) }}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={15} /> Add Item
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-zinc-300" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-zinc-200 rounded-2xl">
          <p className="text-zinc-500 font-medium">No portfolio items yet</p>
          <p className="text-zinc-400 text-sm mt-1">Add your first previous work</p>
          <button
            onClick={() => { setFormError(null); setCreateOpen(true) }}
            className="mt-4 text-sm text-primary underline underline-offset-2 hover:opacity-70"
          >
            Add Item
          </button>
        </div>
      ) : (
        <div className="border border-zinc-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden sm:table-cell">Media</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => move(item, idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        onClick={() => move(item, idx, 1)}
                        disabled={idx === items.length - 1}
                        className="p-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <span className="text-xs text-zinc-400 ml-1">{item.sort_order}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{item.title}</td>
                  <td className="px-4 py-3 text-zinc-500 hidden sm:table-cell">
                    {[
                      item.images?.length ? `${item.images.length} image${item.images.length !== 1 ? "s" : ""}` : null,
                      item.video_path || item.video_url ? "video" : null,
                    ].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleMut.mutate({ id: item.id, is_active: !item.is_active })}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                        item.is_active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                      }`}
                    >
                      {item.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                      {item.is_active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => { setFormError(null); setEditing(item) }}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleting(item)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setFormError(null) }}
        title="Add Portfolio Item"
        size="md"
      >
        <PortfolioForm
          initial={createInitial}
          formKey="new"
          onSave={(v) => createMut.mutate(v)}
          isPending={createMut.isPending}
          error={formError}
        />
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => { setEditing(null); setFormError(null) }}
        title="Edit Portfolio Item"
        size="md"
      >
        <PortfolioForm
          initial={editInitial}
          formKey={editing?.id ?? "new"}
          onSave={(v) => editing && updateMut.mutate({ id: editing.id, values: v })}
          isPending={updateMut.isPending}
          error={formError}
        />
      </Modal>

      <DeleteConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
        isPending={deleteMut.isPending}
        title="Delete Portfolio Item"
        message={`Are you sure you want to delete "${deleting?.title}"? This action cannot be undone.`}
      />
    </div>
  )
}
