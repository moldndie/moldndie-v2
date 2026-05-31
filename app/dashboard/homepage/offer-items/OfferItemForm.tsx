"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Save, Trash2 } from "lucide-react"
import IconPicker from "@/components/dashboard/IconPicker"
import { createOfferItem, updateOfferItem, deleteOfferItem } from "@/services/homeOfferItems.service"
import type { HomeOfferItem } from "@/services/homeOfferItems.service"
import { cn } from "@/lib/utils"

interface Props {
  item?: HomeOfferItem
}

export default function OfferItemForm({ item }: Props) {
  const router = useRouter()
  const isEdit = !!item

  const [title, setTitle]       = useState(item?.title ?? "")
  const [description, setDesc]  = useState(item?.description ?? "")
  const [icon, setIcon]         = useState(item?.icon ?? "BookOpen")
  const [buttonText, setBtnText]= useState(item?.button_text ?? "Explore")
  const [buttonUrl, setBtnUrl]  = useState(item?.button_url ?? "")
  const [sortOrder, setSort]    = useState(String(item?.sort_order ?? 0))
  const [isActive, setActive]   = useState(item?.is_active ?? true)

  const [isSaving, startSave]   = useTransition()
  const [isDeleting, startDel]  = useTransition()

  function handleSave() {
    if (!title.trim()) { toast.error("Title is required."); return }
    if (!icon.trim())  { toast.error("Icon is required."); return }
    startSave(async () => {
      try {
        const input = {
          title: title.trim(),
          description: description.trim() || null,
          icon: icon.trim(),
          button_text: buttonText.trim() || "Explore",
          button_url: buttonUrl.trim() || null,
          sort_order: parseInt(sortOrder, 10) || 0,
          is_active: isActive,
        }
        if (isEdit && item) {
          await updateOfferItem(item.id, input)
        } else {
          await createOfferItem(input)
        }
        toast.success(isEdit ? "Card saved." : "Card created.")
        router.push("/dashboard/homepage/offer-items")
        router.refresh()
      } catch (e) {
        toast.error((e as Error).message || "Failed to save card.")
      }
    })
  }

  function handleDelete() {
    if (!item) return
    if (!confirm("Delete this card? This cannot be undone.")) return
    startDel(async () => {
      try {
        await deleteOfferItem(item.id)
        toast.success("Card deleted.")
        router.push("/dashboard/homepage/offer-items")
        router.refresh()
      } catch (e) {
        toast.error((e as Error).message || "Failed to delete.")
      }
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Action bar */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4">
        <span className="text-sm text-zinc-500">{isEdit ? "Editing card" : "New card"}</span>
        <div className="flex items-center gap-2">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="size-3.5" />
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-60 transition-colors"
          >
            <Save className="size-3.5" />
            {isSaving ? "Saving…" : "Save Card"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Title <span className="text-red-500">*</span></label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Blog"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDesc(e.target.value)}
            rows={4}
            placeholder="Short description of this section…"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Icon <span className="text-red-500">*</span></label>
          <IconPicker value={icon} onChange={setIcon} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Button Text</label>
            <input
              value={buttonText}
              onChange={(e) => setBtnText(e.target.value)}
              placeholder="Explore"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Button URL</label>
            <input
              value={buttonUrl}
              onChange={(e) => setBtnUrl(e.target.value)}
              placeholder="/blogs"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSort(e.target.value)}
              min="0"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
            <p className="text-xs text-zinc-400">Lower number = shown first.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Status</label>
            <button
              type="button"
              onClick={() => setActive((v) => !v)}
              className={cn(
                "flex items-center gap-2 w-full rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-zinc-200 bg-zinc-50 text-zinc-500"
              )}
            >
              <span className={cn("size-2 rounded-full", isActive ? "bg-emerald-500" : "bg-zinc-300")} />
              {isActive ? "Active (visible)" : "Inactive (hidden)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
