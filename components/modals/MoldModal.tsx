"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/image-upload"
import { moldSchema, type MoldFormValues } from "@/schemas/mold.schema"
import { createMold, updateMold } from "@/services/mold.service"
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MoldFormValues>({
    resolver: zodResolver(moldSchema),
    defaultValues: {
      title: "",
      description: "",
      category_id: "",
      price: undefined,
      preview_image: "",
      download_url: "",
    },
  })

  useEffect(() => {
    if (open && mold) {
      reset({
        title: mold.title,
        description: mold.description ?? "",
        category_id: mold.category_id ?? "",
        price: mold.price ?? undefined,
        preview_image: mold.preview_image ?? "",
        download_url: mold.download_url ?? "",
      })
    } else if (open && !mold) {
      reset({ title: "", description: "", category_id: "", price: undefined, preview_image: "", download_url: "" })
    }
  }, [open, mold, reset])

  async function onSubmit(values: MoldFormValues) {
    setSaving(true)
    setError(null)
    try {
      if (isEdit) {
        await updateMold(mold!.id, values)
      } else {
        await createMold(values)
      }
      onSuccess?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Mold" : "Create Mold"}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Title *</label>
          <Input {...register("title")} placeholder="Mold title" />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Description</label>
          <Textarea {...register("description")} placeholder="Describe the mold…" rows={4} />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Category</label>
          <Select {...register("category_id")}>
            <option value="">— No category —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>

        {/* Price */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Price (USD)</label>
          <Input {...register("price")} type="number" step="0.01" min="0" placeholder="0.00" />
          {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
        </div>

        {/* Preview Image */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Preview Image</label>
          <ImageUpload
            bucket="mold-images"
            value={watch("preview_image") || undefined}
            onChange={(url) => setValue("preview_image", url)}
            onClear={() => setValue("preview_image", "")}
          />
        </div>

        {/* Download URL */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Download URL</label>
          <Input {...register("download_url")} placeholder="https://…" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Mold"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
