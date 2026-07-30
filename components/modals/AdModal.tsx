"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CroppableFileUploadField } from "@/components/forms/CroppableFileUploadField"
import { adSchema, AD_PAGE_OPTIONS, type AdFormValues } from "@/schemas/ad.schema"
import { useCreateAd, useUpdateAd } from "@/hooks/queries/useAds"
import type { Ad } from "@/types"

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
    control,
    reset,
    formState: { errors },
  } = useForm<AdFormValues>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: "",
      image_path: "",
      target_pages: [],
      link: "",
      is_active: true,
      starts_at: "",
      ends_at: "",
    },
  })

  useEffect(() => {
    if (!open) {
      setImageUploading(false)
      return
    }
    if (ad) {
      reset({
        title: ad.title,
        image_path: ad.image_path,
        target_pages: ad.target_pages ?? [],
        link: ad.link,
        is_active: ad.is_active,
        starts_at: ad.starts_at ? ad.starts_at.slice(0, 10) : "",
        ends_at: ad.ends_at ? ad.ends_at.slice(0, 10) : "",
      })
    } else {
      reset({
        title: "",
        image_path: "",
        target_pages: [],
        link: "",
        is_active: true,
        starts_at: "",
        ends_at: "",
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
          <CroppableFileUploadField
            folder="ads/images"
            aspect={16 / 9}
            label="Click to upload ad image"
            existingValue={watch("image_path") || null}
            onUploadSuccess={({ key }) => setValue("image_path", key, { shouldValidate: true })}
            onClear={() => setValue("image_path", "", { shouldValidate: true })}
            onUploadingChange={setImageUploading}
          />
          {errors.image_path && (
            <p className="text-xs text-red-500">{errors.image_path.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Destination URL *</label>
          <Input {...register("link")} placeholder="https://example.com" type="url" />
          {errors.link && <p className="text-xs text-red-500">{errors.link.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">Target Pages *</label>
          <Controller
            name="target_pages"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-1.5">
                {AD_PAGE_OPTIONS.map((opt) => {
                  const checked = field.value.includes(opt.value)
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                        checked
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            field.onChange([...field.value, opt.value])
                          } else {
                            field.onChange(field.value.filter((v) => v !== opt.value))
                          }
                        }}
                      />
                      <span
                        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                          checked ? "border-primary bg-primary text-white" : "border-zinc-300"
                        }`}
                      >
                        {checked && (
                          <svg className="h-2 w-2" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      {opt.label}
                    </label>
                  )
                })}
              </div>
            )}
          />
          {errors.target_pages && (
            <p className="text-xs text-red-500">{errors.target_pages.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Start Date</label>
            <Input {...register("starts_at")} type="date" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">End Date</label>
            <Input {...register("ends_at")} type="date" />
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
