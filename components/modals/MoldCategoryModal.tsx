"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { moldCategorySchema, type MoldCategoryFormValues } from "@/schemas/moldCategory.schema"
import type { MoldCategory } from "@/types"

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

interface MoldCategoryModalProps {
  open: boolean
  onClose: () => void
  category?: MoldCategory | null
  onSave: (values: MoldCategoryFormValues) => Promise<unknown>
  onSuccess?: () => void
}

export function MoldCategoryModal({ open, onClose, category, onSave, onSuccess }: MoldCategoryModalProps) {
  const isEdit = !!category
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MoldCategoryFormValues>({
    resolver: zodResolver(moldCategorySchema),
    defaultValues: { name: "", slug: "" },
  })

  const nameValue = watch("name")

  useEffect(() => {
    if (!isEdit && nameValue) {
      setValue("slug", slugify(nameValue), { shouldValidate: false })
    }
  }, [nameValue, isEdit, setValue])

  useEffect(() => {
    if (open && category) {
      reset({ name: category.name, slug: category.slug })
    } else if (open && !category) {
      reset({ name: "", slug: "" })
    }
    setError(null)
  }, [open, category, reset])

  async function onSubmit(values: MoldCategoryFormValues) {
    setSaving(true)
    setError(null)
    try {
      await onSave(values)
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
      title={isEdit ? "Edit Category" : "Create Category"}
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Name *</label>
          <Input {...register("name")} placeholder="Category name" />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Slug *</label>
          <Input
            {...register("slug")}
            placeholder="category-slug"
            className="font-mono text-sm"
          />
          {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Category"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
