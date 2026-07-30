"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileUploadField } from "@/components/forms/FileUploadField"
import { adSchema, AD_PAGE_OPTIONS, type AdFormValues } from "@/schemas/ad.schema"
import { useCreateAd, useUpdateAd } from "@/hooks/queries/useAds"
import type { Ad } from "@/types"

interface AdFormProps {
  ad?: Ad
}

export function AdForm({ ad }: AdFormProps) {
  const router = useRouter()
  const isEdit = !!ad

  const createAd = useCreateAd()
  const updateAd = useUpdateAd()
  const isPending = createAd.isPending || updateAd.isPending

  const [imageUploading, setImageUploading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<AdFormValues>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: ad?.title ?? "",
      image_path: ad?.image_path ?? "",
      link: ad?.link ?? "",
      target_pages: ad?.target_pages ?? [],
      is_active: ad?.is_active ?? true,
      starts_at: ad?.starts_at ? ad.starts_at.slice(0, 16) : "",
      ends_at: ad?.ends_at ? ad.ends_at.slice(0, 16) : "",
    },
  })

  async function onSubmit(values: AdFormValues) {
    setSubmitError(null)
    try {
      if (isEdit) {
        await updateAd.mutateAsync({ id: ad!.id, values })
      } else {
        await createAd.mutateAsync(values)
      }
      router.push("/dashboard/ads")
      router.refresh()
    } catch (e) {
      console.error("[AdForm] submit failed:", e)
      setSubmitError(e instanceof Error ? e.message : "Failed to save ad")
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, (errs) => {
        console.error("[AdForm] validation errors:", errs)
        setSubmitError("Please fix the highlighted fields.")
      })}
      className="max-w-2xl space-y-6"
    >
      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-700">Title *</label>
        <Input {...register("title")} placeholder="Ad title" />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>

      {/* Image */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-700">Image *</label>
        <FileUploadField
          folder="ads"
          accept="image/*"
          label="Click to upload ad image"
          existingValue={watch("image_path") || null}
          onUploadSuccess={({ key }) => setValue("image_path", key, { shouldValidate: true })}
          onClear={() => setValue("image_path", "", { shouldValidate: true })}
          onUploadingChange={setImageUploading}
        />
        {errors.image_path && <p className="text-xs text-red-500">{errors.image_path.message}</p>}
      </div>

      {/* Link */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-700">Destination URL *</label>
        <Input {...register("link")} placeholder="https://example.com" type="url" />
        {errors.link && <p className="text-xs text-red-500">{errors.link.message}</p>}
      </div>

      {/* Target pages — multi-select checkboxes */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700">Target Pages *</label>
        <p className="text-xs text-zinc-500">Select one or more pages where this ad will appear.</p>
        <Controller
          name="target_pages"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AD_PAGE_OPTIONS.map((opt) => {
                const checked = field.value.includes(opt.value)
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors ${
                      checked
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
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
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked ? "border-primary bg-primary text-white" : "border-zinc-300"
                      }`}
                    >
                      {checked && (
                        <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none">
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

      {/* Schedule */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Starts at</label>
          <Input {...register("starts_at")} type="datetime-local" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Ends at</label>
          <Input {...register("ends_at")} type="datetime-local" />
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          {...register("is_active")}
          className="h-4 w-4 rounded border-zinc-300"
        />
        <label htmlFor="is_active" className="text-sm text-zinc-700">Active</label>
      </div>

      {submitError && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{submitError}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={imageUploading || isPending}>
          {imageUploading ? "Uploading…" : isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Ad"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={imageUploading || isPending}
          onClick={() => router.push("/dashboard/ads")}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
