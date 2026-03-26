"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FileUploadField } from "@/components/forms/FileUploadField"
import { adSchema, type AdFormValues } from "@/schemas/ad.schema"
import { useCreateAd, useUpdateAd } from "@/hooks/queries/useAds"
import type { Ad } from "@/types"

const TARGET_TYPE_LABELS: Record<string, string> = {
  blog: "Blog",
  mold: "Mold",
  event: "Event",
  supplier: "Supplier",
  external: "External",
}

const LINK_PLACEHOLDERS: Record<string, string> = {
  blog: "Blog slug or ID",
  mold: "Mold slug or ID",
  event: "Event slug or ID",
  supplier: "Supplier slug or ID",
  external: "https://example.com",
}

interface AdModalProps {
  open: boolean
  onClose: () => void
  ad?: Ad | null
  onSuccess?: () => void
}

export function AdModal({ open, onClose, ad, onSuccess }: AdModalProps) {
  const isEdit = !!ad
  const createAd = useCreateAd()
  const updateAd = useUpdateAd()
  const isPending = createAd.isPending || updateAd.isPending
  const [imageUploading, setImageUploading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AdFormValues>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: "",
      image_path: "",
      target_type: "external",
      link: "",
      is_active: true,
      start_date: "",
      end_date: "",
    },
  })

  const targetType = watch("target_type")

  useEffect(() => {
    if (!open) {
      setImageUploading(false)
      return
    }
    if (ad) {
      reset({
        title: ad.title,
        image_path: ad.image_path,
        target_type: ad.target_type,
        link: ad.link,
        is_active: ad.is_active,
        start_date: ad.start_date ? ad.start_date.slice(0, 10) : "",
        end_date: ad.end_date ? ad.end_date.slice(0, 10) : "",
      })
    } else {
      reset({
        title: "",
        image_path: "",
        target_type: "external",
        link: "",
        is_active: true,
        start_date: "",
        end_date: "",
      })
    }
  }, [open, ad, reset])

  async function onSubmit(values: AdFormValues) {
    try {
      if (isEdit) {
        await updateAd.mutateAsync({ id: ad!.id, values })
      } else {
        await createAd.mutateAsync(values)
      }
      onSuccess?.()
      onClose()
    } catch {
      // error shown via mutationError
    }
  }

  const mutationError = createAd.error ?? updateAd.error

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Ad" : "Create Ad"} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Title *</label>
          <Input {...register("title")} placeholder="Ad title" />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Image *</label>
          <FileUploadField
            folder="ads/images"
            accept="image/*"
            label="Click to upload ad image"
            existingValue={isEdit ? (ad?.image_path ?? null) : null}
            onUploadSuccess={({ key }) => setValue("image_path", key, { shouldValidate: true })}
            onUploadingChange={setImageUploading}
          />
          {errors.image_path && (
            <p className="text-xs text-red-500">{errors.image_path.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Target Type *</label>
            <Select {...register("target_type")}>
              <option value="blog">Blog</option>
              <option value="mold">Mold</option>
              <option value="event">Event</option>
              <option value="supplier">Supplier</option>
              <option value="external">External</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">
              {targetType === "external" ? "URL *" : "Link *"}
            </label>
            <Input
              {...register("link")}
              placeholder={LINK_PLACEHOLDERS[targetType] ?? "Link"}
            />
            {errors.link && <p className="text-xs text-red-500">{errors.link.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Start Date</label>
            <Input {...register("start_date")} type="date" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">End Date</label>
            <Input {...register("end_date")} type="date" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="is_active"
            type="checkbox"
            className="size-4 rounded border-zinc-300 accent-zinc-900"
            {...register("is_active")}
          />
          <label htmlFor="is_active" className="text-sm font-medium text-zinc-700">
            Active
          </label>
        </div>

        {mutationError && (
          <p className="text-sm text-red-500">
            {mutationError instanceof Error ? mutationError.message : "Something went wrong"}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending || imageUploading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || imageUploading}>
            {imageUploading ? "Uploading…" : isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Ad"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
