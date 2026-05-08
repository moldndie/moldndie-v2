"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  createCalcCategory,
  updateCalcCategory,
  deleteCalcCategory,
  toggleCalcCategoryActive,
} from "@/services/calculator.service"
import type { CalcCategory } from "@/types/calculator"

interface Props {
  initialCategories: CalcCategory[]
}

interface FormState {
  name: string
  description: string
  sort_order: string
  is_active: boolean
}

function emptyForm(): FormState {
  return { name: "", description: "", sort_order: "0", is_active: true }
}

export default function CalcCategoriesClient({ initialCategories }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [categories, setCategories] = useState<CalcCategory[]>(initialCategories)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setError(null)
    setShowForm(true)
  }

  function openEdit(cat: CalcCategory) {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      sort_order: String(cat.sort_order),
      is_active: cat.is_active,
    })
    setError(null)
    setShowForm(true)
  }

  function cancel() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm())
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError("Name is required"); return }
    setError(null)

    startTransition(async () => {
      try {
        if (editingId) {
          await updateCalcCategory(editingId, {
            name: form.name.trim(),
            description: form.description.trim() || null,
            sort_order: Number(form.sort_order) || 0,
            is_active: form.is_active,
          })
        } else {
          await createCalcCategory({
            name: form.name.trim(),
            description: form.description.trim() || null,
            sort_order: Number(form.sort_order) || 0,
            is_active: form.is_active,
          })
        }
        router.refresh()
        cancel()
        // Re-fetch by refreshing the page state
        setCategories((prev) => {
          router.refresh()
          return prev
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save")
      }
    })
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    startTransition(async () => {
      try {
        await deleteCalcCategory(id)
        setCategories((prev) => prev.filter((c) => c.id !== id))
        router.refresh()
      } catch (err) {
        alert(err instanceof Error ? err.message : "Delete failed")
      }
    })
  }

  function handleToggleActive(cat: CalcCategory) {
    startTransition(async () => {
      try {
        await toggleCalcCategoryActive(cat.id, !cat.is_active)
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
        )
        router.refresh()
      } catch (err) {
        alert(err instanceof Error ? err.message : "Toggle failed")
      }
    })
  }

  function handleMove(id: string, direction: "up" | "down") {
    const idx = categories.findIndex((c) => c.id === id)
    if (direction === "up" && idx === 0) return
    if (direction === "down" && idx === categories.length - 1) return
    const next = [...categories]
    const swap = direction === "up" ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]

    // Update sort_order for both swapped items
    const a = next[idx]
    const b = next[swap]
    setCategories(next)

    startTransition(async () => {
      try {
        await Promise.all([
          updateCalcCategory(a.id, { sort_order: idx }),
          updateCalcCategory(b.id, { sort_order: swap }),
        ])
        router.refresh()
      } catch {
        // revert on failure
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Create button */}
      <div className="flex justify-end">
        <Button onClick={openCreate} disabled={isPending}>
          <Plus className="size-4" />
          New Category
        </Button>
      </div>

      {/* Inline form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-zinc-700">
            {editingId ? "Edit Category" : "New Category"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600">Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Injection Molding"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600">Sort Order</label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600">Description</label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional description"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cat_active"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="h-4 w-4 rounded border-zinc-300"
            />
            <label htmlFor="cat_active" className="text-sm text-zinc-600">Active</label>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : editingId ? "Save Changes" : "Create"}
            </Button>
            <Button type="button" variant="outline" onClick={cancel} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Categories list */}
      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 py-16 text-center">
          <p className="text-sm text-zinc-400">No categories yet.</p>
          <button
            onClick={openCreate}
            className="mt-2 text-sm text-primary underline underline-offset-2 hover:opacity-70"
          >
            Create your first category
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
          {categories.map((cat, i) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-zinc-50 transition-colors"
            >
              {/* Reorder */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMove(cat.id, "up")}
                  disabled={i === 0 || isPending}
                  className="rounded p-0.5 text-zinc-300 hover:text-zinc-600 disabled:opacity-20 transition-colors"
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  onClick={() => handleMove(cat.id, "down")}
                  disabled={i === categories.length - 1 || isPending}
                  className="rounded p-0.5 text-zinc-300 hover:text-zinc-600 disabled:opacity-20 transition-colors"
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{cat.name}</p>
                {cat.description && (
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{cat.description}</p>
                )}
                <p className="text-[10px] text-zinc-300 mt-0.5">/{cat.slug} · order {cat.sort_order}</p>
              </div>

              {/* Active badge */}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  cat.is_active ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {cat.is_active ? "Active" : "Inactive"}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleActive(cat)}
                  disabled={isPending}
                  className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                  title={cat.is_active ? "Deactivate" : "Activate"}
                >
                  {cat.is_active ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
                <button
                  onClick={() => openEdit(cat)}
                  className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  disabled={isPending}
                  className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
