"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/image-upload"
import { courseSchema, type CourseFormValues } from "@/schemas/course.schema"
import { createCourse, updateCourse } from "@/services/course.service"
import type { Course } from "@/types"

interface CourseModalProps {
  open: boolean
  onClose: () => void
  course?: Course | null
  onSuccess?: () => void
}

export function CourseModal({ open, onClose, course, onSuccess }: CourseModalProps) {
  const isEdit = !!course
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      price: undefined,
      thumbnail: "",
      intro_video: "",
    },
  })

  useEffect(() => {
    if (open && course) {
      reset({
        title: course.title,
        description: course.description ?? "",
        price: course.price ?? undefined,
        thumbnail: course.thumbnail ?? "",
        intro_video: course.intro_video ?? "",
      })
    } else if (open && !course) {
      reset({ title: "", description: "", price: undefined, thumbnail: "", intro_video: "" })
    }
  }, [open, course, reset])

  async function onSubmit(values: CourseFormValues) {
    setSaving(true)
    setError(null)
    try {
      if (isEdit) {
        await updateCourse(course!.id, values)
      } else {
        await createCourse(values)
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
      title={isEdit ? "Edit Course" : "Create Course"}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Title *</label>
          <Input {...register("title")} placeholder="Course title" />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Description</label>
          <Textarea {...register("description")} placeholder="What will students learn…" rows={4} />
        </div>

        {/* Price */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Price (USD)</label>
          <Input {...register("price")} type="number" step="0.01" min="0" placeholder="0.00" />
          {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
        </div>

        {/* Thumbnail */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Thumbnail</label>
          <ImageUpload
            bucket="academy-thumbnails"
            value={watch("thumbnail") || undefined}
            onChange={(url) => setValue("thumbnail", url)}
            onClear={() => setValue("thumbnail", "")}
          />
        </div>

        {/* Intro Video */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Intro Video URL</label>
          <Input {...register("intro_video")} placeholder="https://youtube.com/…" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Course"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
