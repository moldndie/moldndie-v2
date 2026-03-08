"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { blogTagSchema, type BlogTagFormValues } from "@/schemas/blogTag.schema"
import { createTag, updateTag } from "@/services/blogTag.service"
import type { BlogTag } from "@/types"

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

interface TagModalProps {
  open: boolean
  onClose: () => void
  tag?: BlogTag | null
  onCreated?: (tag: BlogTag) => void
  onSuccess?: () => void
  onSave?: (values: BlogTagFormValues) => Promise<unknown>
}

export function TagModal({ open, onClose, tag, onCreated, onSuccess, onSave }: TagModalProps) {
  const isEdit = !!tag
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BlogTagFormValues>({
    resolver: zodResolver(blogTagSchema),
    defaultValues: { name: "", slug: "" },
  })

  const nameValue = watch("name")

  useEffect(() => {
    if (!isEdit && nameValue) {
      setValue("slug", slugify(nameValue), { shouldValidate: false })
    }
  }, [nameValue, isEdit, setValue])

  useEffect(() => {
    if (open && tag) {
      reset({ name: tag.name, slug: tag.slug })
    } else if (open && !tag) {
      reset({ name: "", slug: "" })
    }
    setError(null)
  }, [open, tag, reset])

  async function onSubmit(values: BlogTagFormValues) {
    setSaving(true)
    setError(null)
    try {
      if (onSave) {
        await onSave(values)
      } else if (isEdit) {
        const updated = await updateTag(tag!.id, values)
        onCreated?.(updated)
      } else {
        const created = await createTag(values)
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
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Tag" : "Create Tag"} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Name *</label>
          <Input {...register("name")} placeholder="Tag name" />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Slug *</label>
          <Input {...register("slug")} placeholder="tag-slug" className="font-mono text-sm" />
          {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Tag"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
