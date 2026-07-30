"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import RichTextEditor from "@/components/editor/RichTextEditor"
import { CroppableFileUploadField } from "@/components/forms/CroppableFileUploadField"
import { courseSchema, type CourseFormValues } from "@/schemas/course.schema"
import { useCreateCourse, useUpdateCourse, useAcademyCategories } from "@/hooks/queries/useCourses"
import { cn } from "@/lib/utils"
import { toDoc, fromDoc } from "@/lib/richtext"
import type { Course } from "@/types"

const TRAINEE_LEVELS = [
  { label: "Beginner",     value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Expert",       value: "expert" },
] as const

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

  const { data: categories = [] } = useAcademyCategories()

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
      title:         "",
      description:   "",
      is_free:       true,
      price:         0,
      thumbnail_url: "",
      is_published:  false,
      category_id:   null,
      trainee_level: null,
    },
  })

  const isFree       = watch("is_free")
  const isPublished  = watch("is_published")
  const categoryId   = watch("category_id")
  const traineeLevel = watch("trainee_level")

  useEffect(() => {
    if (!open) {
      setThumbnailUploading(false)
      return
    }

    if (course) {
      const courseIsFree = course.price === null || course.price === 0
      reset({
        title:         course.title,
        description:   course.description ?? "",
        is_free:       courseIsFree,
        price:         courseIsFree ? 0 : (course.price ?? 0),
        thumbnail_url: course.thumbnail_url ?? "",
        is_published:  course.is_published ?? false,
        category_id:   course.category_id ?? null,
        trainee_level: (course.trainee_level as CourseFormValues["trainee_level"]) ?? null,
      })
    } else {
      reset({
        title: "", description: "", is_free: true, price: 0,
        thumbnail_url: "", is_published: false, category_id: null, trainee_level: null,
      })
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
            <RichTextEditor
              key={course?.id ?? "new"}
              value={toDoc(watch("description"))}
              onChange={(v) => setValue("description", fromDoc(v))}
              placeholder="What will students learn…"
              minHeight={120}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Category</label>
            <select
              value={categoryId ?? ""}
              onChange={(e) =>
                setValue("category_id", e.target.value || null, { shouldValidate: true })
              }
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
            >
              <option value="">No category</option>
              {categories
                .filter((c) => c.is_active)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Trainee level */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Level</label>
            <select
              value={traineeLevel ?? ""}
              onChange={(e) =>
                setValue(
                  "trainee_level",
                  (e.target.value as CourseFormValues["trainee_level"]) || null,
                  { shouldValidate: true }
                )
              }
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
            >
              <option value="">No level</option>
              {TRAINEE_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
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
            <CroppableFileUploadField
              folder="courses/thumbnails"
              aspect={16 / 9}
              label="Click to upload thumbnail"
              existingValue={watch("thumbnail_url") || null}
              onUploadSuccess={({ key }) => setValue("thumbnail_url", key, { shouldValidate: true })}
              onClear={() => setValue("thumbnail_url", "", { shouldValidate: true })}
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
