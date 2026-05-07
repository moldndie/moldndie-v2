"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, Loader2, X } from "lucide-react"
import {
  getServices,
  createService,
  updateService,
  deleteService,
  toggleServiceActive,
  updateServiceOrder,
  type ServiceOffering,
  type ServiceOfferingFormValues,
} from "@/services/service.service"
import { QUERY_KEYS } from "@/lib/queryKeys"
import { Modal } from "@/components/ui/modal"
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal"

// ── Helpers ─────────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

const EMPTY_FORM: ServiceOfferingFormValues = {
  title: "",
  slug: "",
  tagline: "",
  description: "",
  highlights: [""],
  image: "",
  is_active: true,
  is_egypt_only: true,
  sort_order: 0,
}

// ── Service Form ─────────────────────────────────────────────────────────────

function ServiceForm({
  initial,
  onSave,
  isPending,
  error,
}: {
  initial: ServiceOfferingFormValues
  onSave: (values: ServiceOfferingFormValues) => void
  isPending: boolean
  error: string | null
}) {
  const [form, setForm] = useState<ServiceOfferingFormValues>(initial)
  const isNew = !initial.title

  useEffect(() => {
    setForm(initial)
  }, [initial])

  function set<K extends keyof ServiceOfferingFormValues>(key: K, value: ServiceOfferingFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleTitleChange(v: string) {
    setForm((prev) => ({
      ...prev,
      title: v,
      slug: isNew ? slugify(v) : prev.slug,
    }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSave(form)
  }

  const inputCls = "w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
  const labelCls = "block text-xs font-semibold text-zinc-700 mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Title *</label>
        <input
          required
          className={inputCls}
          value={form.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Turnkey Project Management"
        />
      </div>

      <div>
        <label className={labelCls}>Slug *</label>
        <input
          required
          className={inputCls}
          value={form.slug}
          onChange={(e) => set("slug", e.target.value)}
          placeholder="turnkey-project-management"
        />
      </div>

      <div>
        <label className={labelCls}>Tagline</label>
        <input
          className={inputCls}
          value={form.tagline ?? ""}
          onChange={(e) => set("tagline", e.target.value)}
          placeholder="One team. Start to finish."
        />
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea
          rows={4}
          className={inputCls}
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Describe the service…"
        />
      </div>

      <div>
        <label className={labelCls}>Highlights</label>
        <div className="space-y-2">
          {(form.highlights ?? [""]).map((h, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputCls}
                value={h}
                onChange={(e) => {
                  const next = [...(form.highlights ?? [""])]
                  next[i] = e.target.value
                  set("highlights", next)
                }}
                placeholder={`Highlight ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => {
                  const next = (form.highlights ?? [""]).filter((_, j) => j !== i)
                  set("highlights", next.length > 0 ? next : [""])
                }}
                className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set("highlights", [...(form.highlights ?? [""]), ""])}
            className="text-xs text-primary font-semibold hover:opacity-70 transition-opacity"
          >
            + Add highlight
          </button>
        </div>
      </div>

      <div>
        <label className={labelCls}>Sort Order</label>
        <input
          type="number"
          className={inputCls}
          value={form.sort_order}
          onChange={(e) => set("sort_order", Number(e.target.value))}
        />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
            className="rounded border-zinc-300"
          />
          <span className="text-sm text-zinc-700">Active</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_egypt_only}
            onChange={(e) => set("is_egypt_only", e.target.checked)}
            className="rounded border-zinc-300"
          />
          <span className="text-sm text-zinc-700">Egypt only</span>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isPending ? "Saving…" : "Save Service"}
        </button>
      </div>
    </form>
  )
}

// ── Main Client ──────────────────────────────────────────────────────────────

export default function ServicesManagementClient() {
  const qc = useQueryClient()

  // Modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceOffering | null>(null)
  const [deletingService, setDeletingService] = useState<ServiceOffering | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: services = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.SERVICES,
    queryFn: getServices,
    staleTime: 2 * 60 * 1000,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: QUERY_KEYS.SERVICES })

  const createMut = useMutation({
    mutationFn: (values: ServiceOfferingFormValues) => createService(values),
    onSuccess: () => { setCreateOpen(false); setFormError(null); invalidate() },
    onError: (e) => setFormError(e instanceof Error ? e.message : "Failed to create."),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ServiceOfferingFormValues }) =>
      updateService(id, values),
    onSuccess: () => { setEditingService(null); setFormError(null); invalidate() },
    onError: (e) => setFormError(e instanceof Error ? e.message : "Failed to update."),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleServiceActive(id, is_active),
    onSuccess: invalidate,
  })

  const orderMut = useMutation({
    mutationFn: ({ id, sort_order }: { id: string; sort_order: number }) =>
      updateServiceOrder(id, sort_order),
    onSuccess: invalidate,
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => { setDeletingService(null); invalidate() },
    onError: (e) => alert(e instanceof Error ? e.message : "Failed to delete."),
  })

  function openCreate() {
    setFormError(null)
    setCreateOpen(true)
  }

  function openEdit(s: ServiceOffering) {
    setFormError(null)
    setEditingService(s)
  }

  function handleCreate(values: ServiceOfferingFormValues) {
    createMut.mutate(values)
  }

  function handleUpdate(values: ServiceOfferingFormValues) {
    if (!editingService) return
    updateMut.mutate({ id: editingService.id, values })
  }

  function moveUp(s: ServiceOffering, idx: number) {
    if (idx === 0) return
    const above = services[idx - 1]
    orderMut.mutate({ id: s.id, sort_order: above.sort_order })
    orderMut.mutate({ id: above.id, sort_order: s.sort_order })
  }

  function moveDown(s: ServiceOffering, idx: number) {
    if (idx === services.length - 1) return
    const below = services[idx + 1]
    orderMut.mutate({ id: s.id, sort_order: below.sort_order })
    orderMut.mutate({ id: below.id, sort_order: s.sort_order })
  }

  const maxOrder = services.reduce((acc, s) => Math.max(acc, s.sort_order), 0)

  // Form initial values for create
  const createInitial: ServiceOfferingFormValues = {
    ...EMPTY_FORM,
    sort_order: maxOrder + 1,
  }

  // Form initial values for edit
  const editInitial: ServiceOfferingFormValues = editingService
    ? {
        title:         editingService.title,
        slug:          editingService.slug,
        tagline:       editingService.tagline ?? "",
        description:   editingService.description ?? "",
        highlights:    (editingService.highlights ?? []).length > 0 ? editingService.highlights! : [""],
        image:         editingService.image ?? "",
        is_active:     editingService.is_active,
        is_egypt_only: editingService.is_egypt_only,
        sort_order:    editingService.sort_order,
      }
    : EMPTY_FORM

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {services.length} service{services.length !== 1 ? "s" : ""} configured
        </p>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={15} /> Add Service
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-zinc-300" />
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-zinc-200 rounded-2xl">
          <p className="text-zinc-500 font-medium">No services yet</p>
          <p className="text-zinc-400 text-sm mt-1">Add your first service offering</p>
          <button
            onClick={openCreate}
            className="mt-4 text-sm text-primary underline underline-offset-2 hover:opacity-70"
          >
            Add Service
          </button>
        </div>
      ) : (
        <div className="border border-zinc-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Order
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden sm:table-cell">
                  Tagline
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">
                  Egypt only
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {services.map((s, idx) => (
                <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveUp(s, idx)}
                        disabled={idx === 0}
                        className="p-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        onClick={() => moveDown(s, idx)}
                        disabled={idx === services.length - 1}
                        className="p-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <span className="text-xs text-zinc-400 ml-1">{s.sort_order}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{s.title}</td>
                  <td className="px-4 py-3 text-zinc-500 hidden sm:table-cell max-w-xs truncate">
                    {s.tagline ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleMut.mutate({ id: s.id, is_active: !s.is_active })}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                        s.is_active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                      }`}
                    >
                      {s.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                      {s.is_active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs font-medium ${s.is_egypt_only ? "text-amber-700" : "text-zinc-400"}`}>
                      {s.is_egypt_only ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingService(s)}
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

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setFormError(null) }}
        title="Add Service"
        size="md"
      >
        <ServiceForm
          initial={createInitial}

          onSave={handleCreate}
          isPending={createMut.isPending}
          error={formError}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editingService}
        onClose={() => { setEditingService(null); setFormError(null) }}
        title="Edit Service"
        size="md"
      >
        <ServiceForm
          initial={editInitial}

          onSave={handleUpdate}
          isPending={updateMut.isPending}
          error={formError}
        />
      </Modal>

      {/* Delete Confirm */}
      <DeleteConfirmModal
        open={!!deletingService}
        onClose={() => setDeletingService(null)}
        onConfirm={() => deletingService && deleteMut.mutate(deletingService.id)}
        isPending={deleteMut.isPending}
        title="Delete Service"
        message={`Are you sure you want to delete "${deletingService?.title}"? This action cannot be undone.`}
      />
    </div>
  )
}
