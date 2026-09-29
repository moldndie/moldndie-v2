"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Save, Trash2 } from "lucide-react"
import IconPicker from "@/components/dashboard/IconPicker"
import { createWhyCard, updateWhyCard, deleteWhyCard } from "@/services/homeWhyCards.service"
import type { HomeWhyCard } from "@/services/homeWhyCards.service"
import { cn } from "@/lib/utils"
import RichTextEditor from "@/components/editor/RichTextEditor"
import { toDoc, fromDoc } from "@/lib/richtext"

interface Props {
  card?: HomeWhyCard
}

export default function WhyCardForm({ card }: Props) {
  const router = useRouter()
  const isEdit = !!card

  const [title, setTitle]      = useState(card?.title ?? "")
  const [description, setDesc] = useState(card?.description ?? "")
  const [icon, setIcon]        = useState(card?.icon ?? "Award")
  const [sortOrder, setSort]   = useState(String(card?.sort_order ?? 0))
  const [isActive, setActive]  = useState(card?.is_active ?? true)

  const [isSaving, startSave]  = useTransition()
  const [isDeleting, startDel] = useTransition()

  function handleSave() {
    if (!title.trim()) { toast.error("Title is required."); return }
    if (!icon.trim())  { toast.error("Icon is required."); return }
    startSave(async () => {
      try {
        const input = {
          title: title.trim(),
          description: description.trim() || null,
          icon: icon.trim(),
          sort_order: parseInt(sortOrder, 10) || 0,
          is_active: isActive,
        }
        if (isEdit && card) {
          await updateWhyCard(card.id, input)
        } else {
          await createWhyCard(input)
        }
        toast.success(isEdit ? "Card saved." : "Card created.")
        router.push("/dashboard/homepage/why-cards")
        router.refresh()
      } catch (e) {
        toast.error((e as Error).message || "Failed to save card.")
      }
    })
  }

  function handleDelete() {
    if (!card) return
    if (!confirm("Delete this card? This cannot be undone.")) return
    startDel(async () => {
      try {
        await deleteWhyCard(card.id)
        toast.success("Card deleted.")
        router.push("/dashboard/homepage/why-cards")
        router.refresh()
      } catch (e) {
        toast.error((e as Error).message || "Failed to delete.")
      }
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4">
        <span className="text-sm text-zinc-500">{isEdit ? "Editing card" : "New card"}</span>
        <div className="flex items-center gap-2">
          {isEdit && (
            <Button variant="ghost-danger" size="lg"
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="border-red-200 text-red-600 text-xs"
            >
              <Trash2 className="size-3.5" />
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          )}
          <Button size="lg"
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 text-xs"
          >
            <Save className="size-3.5" />
            {isSaving ? "Saving…" : "Save Card"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Title <span className="text-red-500">*</span></label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Real-World Expertise"
            className="h-auto px-3 py-2.5"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Description</label>
          <RichTextEditor
            value={toDoc(description)}
            onChange={(v) => setDesc(fromDoc(v))}
            placeholder="Describe why this differentiator matters…"
            minHeight={160}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Icon <span className="text-red-500">*</span></label>
          <IconPicker value={icon} onChange={setIcon} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Sort Order</label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSort(e.target.value)}
              min="0"
              className="h-auto px-3 py-2.5"
            />
            <p className="text-xs text-zinc-400">Lower number = shown first.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Status</label>
            <button aria-pressed={isActive}
              type="button"
              onClick={() => setActive((v) => !v)}
              className="ui-pill flex items-center gap-2 w-full rounded-lg border px-3 py-2.5 text-sm font-medium"
            >
              <span className={cn("size-2 rounded-full", isActive ? "bg-current" : "bg-zinc-300")} />
              {isActive ? "Active (visible)" : "Inactive (hidden)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
