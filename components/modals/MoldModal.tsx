"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FileUploadField } from "@/components/forms/FileUploadField"
import { GalleryGrid, type LocalGalleryItem } from "@/components/mold/GalleryGrid"
import { moldSchema, type MoldFormValues } from "@/schemas/mold.schema"
import { useCreateMold, useUpdateMold } from "@/hooks/queries/useMolds"
import { getGalleryItems, addGalleryItems, deleteGalleryItem } from "@/services/moldGallery.service"
import { cn } from "@/lib/utils"
import type { Mold, MoldCategory } from "@/types"

interface MoldModalProps {
  open: boolean
  onClose: () => void
  mold?: Mold | null
  categories: MoldCategory[]
  onSuccess?: () => void
}

export function MoldModal({ open, onClose, mold, categories, onSuccess }: MoldModalProps) {
  const isEdit = !!mold
  const createMold = useCreateMold()
  const updateMold = useUpdateMold()
  const isPending = createMold.isPending || updateMold.isPending

  const [step, setStep] = useState<1 | 2>(1)
  const [galleryItems, setGalleryItems] = useState<LocalGalleryItem[]>([])
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([])
  const [galleryUploading, setGalleryUploading] = useState(false)

  // Step 1 upload states
  const [fileUploading, setFileUploading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const isUploading = fileUploading || imageUploading

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    trigger,
    formState: { errors },
  } = useForm<MoldFormValues>({
    resolver: zodResolver(moldSchema),
    defaultValues: {
      title: "",
      description: "",
      category_id: "",
      is_free: true,
      price: 0,
      preview_image: "",
      file_key: "",
    },
  })

  const isFree = watch("is_free")

  // Reset form + gallery when modal opens/closes
  useEffect(() => {
    if (!open) {
      setStep(1)
      setGalleryItems([])
      setDeletedItemIds([])
      setFileUploading(false)
      setImageUploading(false)
      setGalleryUploading(false)
      return
    }

    if (mold) {
      const moldIsFree = mold.price === null || mold.price === 0
      reset({
        title: mold.title,
        description: mold.description ?? "",
        category_id: mold.category_id ?? "",
        is_free: moldIsFree,
        price: moldIsFree ? 0 : (mold.price ?? 0),
        preview_image: mold.preview_image ?? "",
        file_key: mold.file_key ?? "",
      })
      // Load existing gallery
      setGalleryItems([])
      setDeletedItemIds([])
      getGalleryItems(mold.id).then((dbItems) => {
        setGalleryItems(
          dbItems.map((item) => ({
            id: item.id,
            key: item.file_key,
            type: item.type,
          }))
        )
      })
    } else {
      reset({
        title: "",
        description: "",
        category_id: "",
        is_free: true,
        price: 0,
        preview_image: "",
        file_key: "",
      })
      setGalleryItems([])
      setDeletedItemIds([])
    }
  }, [open, mold, reset])

  function handleFreeToggle() {
    const next = !isFree
    setValue("is_free", next, { shouldValidate: true })
    if (next) setValue("price", 0, { shouldValidate: true })
  }

  async function handleNext() {
    const isValid = await trigger()
    if (isValid) setStep(2)
  }

  function handleGalleryAdd(item: LocalGalleryItem) {
    setGalleryItems((prev) => [...prev, item])
  }

  function handleGalleryRemove(index: number) {
    setGalleryItems((prev) => {
      const item = prev[index]
      if (item?.id) {
        setDeletedItemIds((ids) => [...ids, item.id!])
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  async function onSubmit(values: MoldFormValues) {
    let savedMold: Mold
    try {
      savedMold = isEdit
        ? await updateMold.mutateAsync({ id: mold!.id, values })
        : await createMold.mutateAsync(values)
    } catch {
      return // mutation error shown via mutationError below
    }

    const newItems = galleryItems.filter((item) => !item.id)
    if (newItems.length > 0) {
      await addGalleryItems(
        savedMold.id,
        newItems.map((item, i) => ({
          file_key: item.key,
          type: item.type,
          position: i,
        }))
      )
    }

    await Promise.all(deletedItemIds.map((id) => deleteGalleryItem(id)))

    onSuccess?.()
    onClose()
  }

  const mutationError = createMold.error ?? updateMold.error
  const modalTitle = `${isEdit ? "Edit" : "Create"} Mold${step === 2 ? " — Gallery" : ""}`

  return (
    <Modal open={open} onClose={onClose} title={modalTitle} size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step indicator */}
        <div className="mb-5 flex gap-1">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                step >= s ? "bg-zinc-900" : "bg-zinc-200"
              )}
            />
          ))}
        </div>

        {/* ── Step 1: Details ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Title *</label>
              <Input {...register("title")} placeholder="Mold title" />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Description</label>
              <Textarea {...register("description")} placeholder="Describe the mold…" rows={3} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Category</label>
              <Select {...register("category_id")}>
                <option value="">— No category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>

            {/* Free / Paid toggle */}
            <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-800">Free mold</p>
                <p className="text-xs text-zinc-500">Toggle off to set a price</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isFree}
                onClick={handleFreeToggle}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
                  isFree ? "bg-zinc-900" : "bg-zinc-200"
                )}
              >
                <span
                  className={cn(
                    "inline-block size-4 rounded-full bg-white shadow transition-transform",
                    isFree ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {!isFree && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Price (USD) *</label>
                <Input
                  {...register("price", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="9.99"
                />
                {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Preview Image</label>
              <FileUploadField
                folder="molds/previews"
                accept="image/*"
                label="Click to upload preview image"
                existingValue={isEdit ? (mold?.preview_image ?? null) : null}
                onUploadSuccess={({ key }) => setValue("preview_image", key, { shouldValidate: true })}
                onUploadingChange={setImageUploading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Mold File *</label>
              <FileUploadField
                folder="molds/files"
                accept=".zip,.step,.stl,.obj,.3mf"
                label="Click to select mold file (.zip, .step, .stl…)"
                existingValue={isEdit ? (mold?.file_key ?? null) : null}
                onUploadSuccess={({ key }) => setValue("file_key", key, { shouldValidate: true })}
                onUploadingChange={setFileUploading}
              />
              {errors.file_key && <p className="text-xs text-red-500">{errors.file_key.message}</p>}
            </div>

            {mutationError && (
              <p className="text-sm text-red-500">
                {mutationError instanceof Error ? mutationError.message : "Something went wrong"}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="button" onClick={handleNext} disabled={isUploading}>
                Next →
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Gallery ── */}
        {step === 2 && (
          <div className="space-y-5">
            <GalleryGrid
              items={galleryItems}
              onAdd={handleGalleryAdd}
              onRemove={handleGalleryRemove}
              onUploadingChange={setGalleryUploading}
            />

            {mutationError && (
              <p className="text-sm text-red-500">
                {mutationError instanceof Error ? mutationError.message : "Something went wrong"}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isPending || galleryUploading}
              >
                ← Back
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isPending || galleryUploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || galleryUploading}>
                  {galleryUploading
                    ? "Uploading…"
                    : isPending
                      ? "Saving…"
                      : isEdit
                        ? "Save Changes"
                        : "Create Mold"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
