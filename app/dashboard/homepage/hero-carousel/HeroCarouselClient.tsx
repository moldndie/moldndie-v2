"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Images,
  ImageOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CroppableFileUploadField } from "@/components/forms/CroppableFileUploadField"
import {
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  updateSlideOrder,
} from "@/services/heroSlides.service"
import type { HeroSlide } from "@/services/heroSlides.service"
import { MAX_HERO_SLIDES, isValidImageUrl } from "@/lib/heroSlides.constants"

interface Props {
  initialSlides: HeroSlide[]
}

interface SlideForm {
  image_url: string
  mobile_image: string
  title: string
  subtitle: string
  button_text: string
  button_link: string
  alt_text: string
}

const EMPTY_FORM: SlideForm = {
  image_url: "",
  mobile_image: "",
  title: "",
  subtitle: "",
  button_text: "",
  button_link: "",
  alt_text: "",
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  optional = true,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  optional?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-700">
        {label}{" "}
        {optional && <span className="text-zinc-400 font-normal">(optional)</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
      />
    </div>
  )
}

export default function HeroCarouselClient({ initialSlides }: Props) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides)
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<SlideForm>(EMPTY_FORM)
  // formKey forces CroppableFileUploadField to remount on form reset
  const [formKey, setFormKey] = useState(0)
  const [imageUploading, setImageUploading] = useState(false)
  const [mobileUploading, setMobileUploading] = useState(false)

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<SlideForm>(EMPTY_FORM)
  const [editFormKey, setEditFormKey] = useState(0)
  const [editImageUploading, setEditImageUploading] = useState(false)
  const [editMobileUploading, setEditMobileUploading] = useState(false)

  const activeCount = slides.filter((s) => s.is_active).length
  const isUploading = imageUploading || mobileUploading
  const isEditUploading = editImageUploading || editMobileUploading

  function field(key: keyof SlideForm) {
    return (v: string) => setForm((prev) => ({ ...prev, [key]: v }))
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setFormKey((k) => k + 1)
    setShowForm(false)
  }

  function editField(key: keyof SlideForm) {
    return (v: string) => setEditForm((prev) => ({ ...prev, [key]: v }))
  }

  function openEdit(slide: HeroSlide) {
    setEditingId(slide.id)
    setEditForm({
      image_url: slide.image_url,
      mobile_image: slide.mobile_image ?? "",
      title: slide.title ?? "",
      subtitle: slide.subtitle ?? "",
      button_text: slide.button_text ?? "",
      button_link: slide.button_link ?? "",
      alt_text: slide.alt_text ?? "",
    })
    setEditFormKey((k) => k + 1)
    setShowForm(false)
  }

  function closeEdit() {
    setEditingId(null)
    setEditForm(EMPTY_FORM)
  }

  function handleSaveEdit() {
    if (!editingId) return
    if (!isValidImageUrl(editForm.image_url)) {
      toast.error("Please upload a slide image first.")
      return
    }
    setPendingId(editingId)
    startTransition(async () => {
      try {
        await updateHeroSlide(editingId, {
          image_url: editForm.image_url,
          mobile_image: editForm.mobile_image || null,
          title: editForm.title || null,
          subtitle: editForm.subtitle || null,
          button_text: editForm.button_text || null,
          button_link: editForm.button_link || null,
          alt_text: editForm.alt_text || null,
        })
        setSlides((prev) =>
          prev.map((s) =>
            s.id === editingId
              ? {
                  ...s,
                  image_url: editForm.image_url,
                  mobile_image: editForm.mobile_image || null,
                  title: editForm.title || null,
                  subtitle: editForm.subtitle || null,
                  button_text: editForm.button_text || null,
                  button_link: editForm.button_link || null,
                  alt_text: editForm.alt_text || null,
                }
              : s,
          ),
        )
        closeEdit()
        toast.success("Slide updated.")
      } catch (e) {
        toast.error((e as Error).message ?? "Failed to update slide.")
      } finally {
        setPendingId(null)
      }
    })
  }

  function handleAdd() {
    if (!isValidImageUrl(form.image_url)) {
      toast.error("Please upload a slide image first.")
      return
    }

    const willBeActive = activeCount < MAX_HERO_SLIDES
    const nextOrder =
      slides.length > 0 ? Math.max(...slides.map((s) => s.sort_order)) + 1 : 0

    startTransition(async () => {
      try {
        const created = await createHeroSlide({
          image_url: form.image_url,
          mobile_image: form.mobile_image || null,
          title: form.title || null,
          subtitle: form.subtitle || null,
          button_text: form.button_text || null,
          button_link: form.button_link || null,
          alt_text: form.alt_text || null,
          sort_order: nextOrder,
          is_active: willBeActive,
        })
        setSlides((prev) => [...prev, created])
        resetForm()
        toast.success(
          willBeActive
            ? "Slide added and active."
            : `Slide added as inactive (${MAX_HERO_SLIDES}-slide limit reached).`,
        )
      } catch (e) {
        toast.error((e as Error).message ?? "Failed to add slide.")
      }
    })
  }

  function handleToggle(slide: HeroSlide) {
    if (!slide.is_active && activeCount >= MAX_HERO_SLIDES) {
      toast.error(`Maximum ${MAX_HERO_SLIDES} active slides allowed. Deactivate one first.`)
      return
    }
    setPendingId(slide.id)
    startTransition(async () => {
      try {
        await updateHeroSlide(slide.id, { is_active: !slide.is_active })
        setSlides((prev) =>
          prev.map((s) => (s.id === slide.id ? { ...s, is_active: !s.is_active } : s)),
        )
      } catch (e) {
        toast.error((e as Error).message ?? "Failed to update slide.")
      } finally {
        setPendingId(null)
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this slide? This cannot be undone.")) return
    setPendingId(id)
    startTransition(async () => {
      try {
        await deleteHeroSlide(id)
        setSlides((prev) => prev.filter((s) => s.id !== id))
        toast.success("Slide deleted.")
      } catch (e) {
        toast.error((e as Error).message ?? "Failed to delete slide.")
      } finally {
        setPendingId(null)
      }
    })
  }

  function handleMove(id: string, dir: "up" | "down") {
    const idx = slides.findIndex((s) => s.id === id)
    if (dir === "up" && idx === 0) return
    if (dir === "down" && idx === slides.length - 1) return

    const swapIdx = dir === "up" ? idx - 1 : idx + 1
    const next = [...slides]
    const aOrder = next[idx].sort_order
    const bOrder = next[swapIdx].sort_order
    next[idx] = { ...next[idx], sort_order: bOrder }
    next[swapIdx] = { ...next[swapIdx], sort_order: aOrder }
    ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    setSlides(next)

    startTransition(async () => {
      try {
        await Promise.all([
          updateSlideOrder(next[swapIdx].id, next[swapIdx].sort_order),
          updateSlideOrder(next[idx].id, next[idx].sort_order),
        ])
      } catch {
        toast.error("Failed to reorder. Refreshing…")
        setSlides(slides)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-zinc-500">
          <span className="font-semibold text-zinc-900">{activeCount}</span> of{" "}
          <span className="font-semibold text-zinc-900">{MAX_HERO_SLIDES}</span> active slides
          {activeCount >= MAX_HERO_SLIDES && (
            <span className="ml-2 text-amber-600 font-medium">(limit reached)</span>
          )}
        </p>

        <button
          onClick={() => { setShowForm((v) => !v); closeEdit() }}
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="size-4" />
          Add Slide
        </button>
      </div>

      {/* ── Add form ── */}
      {showForm && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-5">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">New Slide</h3>

          {/* Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Desktop Image <span className="text-red-500">*</span>
              </label>
              <CroppableFileUploadField
                key={`desktop-${formKey}`}
                folder="hero/slides"
                aspect={16 / 9}
                label="Click to upload desktop image (16:9)"
                onUploadSuccess={({ url }) => field("image_url")(url)}
                onUploadingChange={setImageUploading}
              />
              <p className="mt-1.5 text-xs text-zinc-400">
                Landscape 16:9 — recommended 1920×1080px or wider.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Mobile Image{" "}
                <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <CroppableFileUploadField
                key={`mobile-${formKey}`}
                folder="hero/slides"
                aspect={9 / 16}
                label="Click to upload mobile image (9:16)"
                onUploadSuccess={({ url }) => field("mobile_image")(url)}
                onUploadingChange={setMobileUploading}
              />
              <p className="mt-1.5 text-xs text-zinc-400">
                Portrait 9:16 — falls back to desktop image if omitted.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Title"
              value={form.title}
              onChange={field("title")}
              placeholder="e.g. New Academy Course"
            />
            <FormField
              label="Subtitle"
              value={form.subtitle}
              onChange={field("subtitle")}
              placeholder="Short supporting text"
            />
            <FormField
              label="Button Text"
              value={form.button_text}
              onChange={field("button_text")}
              placeholder="e.g. Learn More"
            />
            <FormField
              label="Button Link"
              value={form.button_link}
              onChange={field("button_link")}
              placeholder="/courses"
            />
          </div>

          {/* SEO */}
          <div className="border-t border-zinc-100 pt-4 space-y-1.5">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-3">
              SEO / Accessibility
            </p>
            <FormField
              label="Image Alt Text"
              value={form.alt_text}
              onChange={field("alt_text")}
              placeholder="Describe the image for screen readers and search engines"
            />
          </div>

          {activeCount >= MAX_HERO_SLIDES && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              The {MAX_HERO_SLIDES}-slide limit is reached. This slide will be added as{" "}
              <strong>inactive</strong>. Deactivate an existing slide to show it on the homepage.
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending || isUploading || !isValidImageUrl(form.image_url)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm px-6 py-2 rounded-lg transition-colors"
            >
              {isPending || isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {isUploading ? "Uploading…" : "Add Slide"}
            </button>
          </div>
        </div>
      )}

      {/* ── Slide list ── */}
      {slides.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-zinc-200 p-16 flex flex-col items-center gap-3 text-center">
          <Images className="size-10 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-400">No slides yet</p>
          <p className="text-xs text-zinc-400">
            Add your first slide to enable the hero carousel on the homepage.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, idx) => (
            <div key={slide.id} className="space-y-2">
            <div
              className={cn(
                "bg-white rounded-xl border border-zinc-200 p-4 flex gap-4 items-center transition-opacity duration-200",
                !slide.is_active && "opacity-55",
                pendingId === slide.id && "opacity-30 pointer-events-none",
              )}
            >
              {/* Thumbnail */}
              <div className="relative w-56 aspect-video shrink-0 rounded-lg bg-zinc-100 flex items-center justify-center overflow-hidden">
                {isValidImageUrl(slide.image_url) ? (
                  <Image
                    src={slide.image_url}
                    alt={slide.alt_text ?? slide.title ?? `Slide ${idx + 1}`}
                    fill
                    className="object-contain"
                    sizes="128px"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-zinc-400" title={`Invalid image URL: ${slide.image_url}`}>
                    <ImageOff className="size-5" />
                    <span className="text-[10px] font-medium">No image</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">
                  {slide.title ?? (
                    <span className="italic text-zinc-400 font-normal">No title</span>
                  )}
                </p>
                {slide.subtitle && (
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{slide.subtitle}</p>
                )}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
                      slide.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-zinc-100 text-zinc-500",
                    )}
                  >
                    {slide.is_active ? "Active" : "Inactive"}
                  </span>
                  {!isValidImageUrl(slide.image_url) && (
                    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                      Invalid image URL
                    </span>
                  )}
                  {slide.mobile_image && isValidImageUrl(slide.mobile_image) && (
                    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                      Mobile image
                    </span>
                  )}
                  <span className="text-xs text-zinc-400">Position #{idx + 1}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleMove(slide.id, "up")}
                  disabled={idx === 0 || isPending}
                  title="Move up"
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  onClick={() => handleMove(slide.id, "down")}
                  disabled={idx === slides.length - 1 || isPending}
                  title="Move down"
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronDown className="size-4" />
                </button>

                <button
                  onClick={() => (editingId === slide.id ? closeEdit() : openEdit(slide))}
                  disabled={isPending}
                  title={editingId === slide.id ? "Cancel edit" : "Edit slide"}
                  className={cn(
                    "p-1.5 rounded-md transition-colors disabled:opacity-30",
                    editingId === slide.id
                      ? "text-primary bg-primary/10 hover:bg-primary/20"
                      : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100",
                  )}
                >
                  <Pencil className="size-4" />
                </button>

                <button
                  onClick={() => handleToggle(slide)}
                  disabled={isPending}
                  title={slide.is_active ? "Deactivate" : "Activate"}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 transition-colors"
                >
                  {slide.is_active ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>

                <button
                  onClick={() => handleDelete(slide.id)}
                  disabled={isPending}
                  title="Delete slide"
                  className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            {/* ── Inline edit form ── */}
            {editingId === slide.id && (
              <div className="bg-zinc-50 rounded-xl border border-primary/20 p-6 space-y-5">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                  Edit Slide
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                      Desktop Image <span className="text-red-500">*</span>
                    </label>
                    <CroppableFileUploadField
                      key={`edit-desktop-${slide.id}-${editFormKey}`}
                      folder="hero/slides"
                      aspect={16 / 9}
                      label="Click to replace desktop image (16:9)"
                      existingValue={editForm.image_url || null}
                      onUploadSuccess={({ url }) => editField("image_url")(url)}
                      onUploadingChange={setEditImageUploading}
                    />
                    <p className="mt-1.5 text-xs text-zinc-400">
                      Landscape 16:9 — recommended 1920×1080px or wider.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                      Mobile Image{" "}
                      <span className="text-zinc-400 font-normal">(optional)</span>
                    </label>
                    <CroppableFileUploadField
                      key={`edit-mobile-${slide.id}-${editFormKey}`}
                      folder="hero/slides"
                      aspect={9 / 16}
                      label="Click to add mobile image (9:16)"
                      existingValue={editForm.mobile_image || null}
                      onUploadSuccess={({ url }) => editField("mobile_image")(url)}
                      onUploadingChange={setEditMobileUploading}
                    />
                    <p className="mt-1.5 text-xs text-zinc-400">
                      Portrait 9:16 — falls back to desktop image if omitted.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Title"
                    value={editForm.title}
                    onChange={editField("title")}
                    placeholder="e.g. New Academy Course"
                  />
                  <FormField
                    label="Subtitle"
                    value={editForm.subtitle}
                    onChange={editField("subtitle")}
                    placeholder="Short supporting text"
                  />
                  <FormField
                    label="Button Text"
                    value={editForm.button_text}
                    onChange={editField("button_text")}
                    placeholder="e.g. Learn More"
                  />
                  <FormField
                    label="Button Link"
                    value={editForm.button_link}
                    onChange={editField("button_link")}
                    placeholder="/courses"
                  />
                </div>

                <div className="border-t border-zinc-200 pt-4 space-y-1.5">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-3">
                    SEO / Accessibility
                  </p>
                  <FormField
                    label="Image Alt Text"
                    value={editForm.alt_text}
                    onChange={editField("alt_text")}
                    placeholder="Describe the image for screen readers and search engines"
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isPending || isEditUploading || !isValidImageUrl(editForm.image_url)}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm px-6 py-2 rounded-lg transition-colors"
                  >
                    {isPending || isEditUploading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Pencil className="size-4" />
                    )}
                    {isEditUploading ? "Uploading…" : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
            </div>
          ))}
        </div>
      )}

      {slides.length > 0 && (
        <p className="text-xs text-zinc-400 text-center">
          The carousel is{" "}
          <span className={cn("font-medium", activeCount > 0 ? "text-emerald-600" : "text-zinc-500")}>
            {activeCount > 0 ? "live on the homepage" : "hidden — no active slides"}
          </span>
          . Changes take effect immediately after saving.
        </p>
      )}
    </div>
  )
}
