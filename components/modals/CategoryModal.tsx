"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { blogCategorySchema, type BlogCategoryFormValues } from "@/schemas/blogCategory.schema"
import { createCategory, updateCategory } from "@/services/blogCategory.service"
import type { BlogCategory } from "@/types"

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

interface CategoryModalProps {
  open: boolean
  onClose: () => void
  category?: BlogCategory | null
  onCreated?: (category: BlogCategory) => void
  onSuccess?: () => void
  onSave?: (values: BlogCategoryFormValues) => Promise<void>
}

export function CategoryModal({ open, onClose, category, onCreated, onSuccess, onSave }: CategoryModalProps) {
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
  } = useForm<BlogCategoryFormValues>({
    resolver: zodResolver(blogCategorySchema),
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

  async function onSubmit(values: BlogCategoryFormValues) {
    setSaving(true)
    setError(null)
    try {
      if (onSave) {
        await onSave(values)
      } else if (isEdit) {
        const updated = await updateCategory(category!.id, values)
        onCreated?.(updated)
      } else {
        const created = await createCategory(values)
        onCreated?.(created)
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
