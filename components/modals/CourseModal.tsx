"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileUploadField } from "@/components/forms/FileUploadField"
import { courseSchema, type CourseFormValues } from "@/schemas/course.schema"
import { useCreateCourse, useUpdateCourse } from "@/hooks/queries/useCourses"
import { cn } from "@/lib/utils"
import type { Course } from "@/types"

interface CourseModalProps {
  open: boolean
  onClose: () => void
  course?: Course | null
  onSuccess?: () => void
}

export function CourseModal({ open, onClose, course, onSuccess }: CourseModalProps) {
  const isEdit = !!course
  const router = useRouter()
  const createCourse = useCreateCourse()
  const updateCourse = useUpdateCourse()
  const isPending = createCourse.isPending || updateCourse.isPending

  const [thumbnailUploading, setThumbnailUploading] = useState(false)

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
      is_free: true,
      price: 0,
      thumbnail_url: "",
      is_published: false,
    },
  })

  const isFree = watch("is_free")
  const isPublished = watch("is_published")

  useEffect(() => {
    if (!open) {
      setThumbnailUploading(false)
      return
    }

    if (course) {
      const courseIsFree = course.price === null || course.price === 0
      reset({
        title: course.title,
        description: course.description ?? "",
        is_free: courseIsFree,
        price: courseIsFree ? 0 : (course.price ?? 0),
        thumbnail_url: course.thumbnail_url ?? "",
        is_published: course.is_published ?? false,
      })
    } else {
      reset({ title: "", description: "", is_free: true, price: 0, thumbnail_url: "", is_published: false })
    }
  }, [open, course, reset])

  function handleFreeToggle() {
    const next = !isFree
    setValue("is_free", next, { shouldValidate: true })
    if (next) setValue("price", 0, { shouldValidate: true })
  }

  async function onSubmit(values: CourseFormValues) {
    if (isEdit) {
      try {
        await updateCourse.mutateAsync({ id: course!.id, values })
      } catch {
        return
      }
      onSuccess?.()
      onClose()
    } else {
      let savedCourse: Course
      try {
        savedCourse = await createCourse.mutateAsync(values)
      } catch {
        return
      }
      onClose()
      router.push(`/dashboard/courses/${savedCourse.id}`)
    }
  }

  const mutationError = createCourse.error ?? updateCourse.error

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Course" : "Create Course"} size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Title *</label>
            <Input {...register("title")} placeholder="Course title" />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Description</label>
            <Textarea {...register("description")} placeholder="What will students learn…" rows={3} />
          </div>

          {/* Free / Paid toggle */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-800">Free course</p>
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
              <label className="text-sm font-medium text-zinc-700">Price (EGP) *</label>
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
            <label className="text-sm font-medium text-zinc-700">Thumbnail</label>
            <FileUploadField
              folder="courses/thumbnails"
              accept="image/*"
              label="Click to upload thumbnail"
              existingValue={isEdit ? (course?.thumbnail_url ?? null) : null}
              onUploadSuccess={({ key }) => setValue("thumbnail_url", key, { shouldValidate: true })}
              onUploadingChange={setThumbnailUploading}
            />
          </div>

          {/* Published toggle */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-800">Published</p>
              <p className="text-xs text-zinc-500">Make this course visible to students</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPublished}
              onClick={() => setValue("is_published", !isPublished, { shouldValidate: true })}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
                isPublished ? "bg-zinc-900" : "bg-zinc-200"
              )}
            >
              <span
                className={cn(
                  "inline-block size-4 rounded-full bg-white shadow transition-transform",
                  isPublished ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          {mutationError && (
            <p className="text-sm text-red-500">
              {mutationError instanceof Error ? mutationError.message : "Something went wrong"}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={thumbnailUploading || isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={thumbnailUploading || isPending}>
              {thumbnailUploading
                ? "Uploading…"
                : isPending
                  ? "Saving…"
                  : isEdit
                    ? "Save Changes"
                    : "Create Course"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
