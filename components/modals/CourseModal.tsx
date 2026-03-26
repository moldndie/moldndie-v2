"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileUploadField } from "@/components/forms/FileUploadField"
import { LessonsEditor, type LocalLesson } from "@/components/course/LessonsEditor"
import { courseSchema, type CourseFormValues } from "@/schemas/course.schema"
import { useCreateCourse, useUpdateCourse } from "@/hooks/queries/useCourses"
import { getLessons, replaceLessons } from "@/services/courseLesson.service"
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
  const createCourse = useCreateCourse()
  const updateCourse = useUpdateCourse()
  const isPending = createCourse.isPending || updateCourse.isPending

  const [step, setStep] = useState<1 | 2>(1)
  const [lessons, setLessons] = useState<LocalLesson[]>([])
  const [thumbnailUploading, setThumbnailUploading] = useState(false)
  const [pdfUploading, setPdfUploading] = useState(false)
  const isUploading = thumbnailUploading || pdfUploading

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    trigger,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      is_free: true,
      price: 0,
      thumbnail: "",
    },
  })

  const isFree = watch("is_free")

  // Reset form + lessons when modal opens/closes
  useEffect(() => {
    if (!open) {
      setStep(1)
      setLessons([])
      setThumbnailUploading(false)
      setPdfUploading(false)
      return
    }

    if (course) {
      const courseIsFree = course.price === null || course.price === 0
      reset({
        title: course.title,
        description: course.description ?? "",
        is_free: courseIsFree,
        price: courseIsFree ? 0 : (course.price ?? 0),
        thumbnail: course.thumbnail ?? "",
      })
      setLessons([])
      getLessons(course.id).then((dbLessons) => {
        setLessons(
          dbLessons.map((l) => ({
            id: l.id,
            title: l.title,
            video_url: l.video_url ?? "",
            pdf_key: l.pdf_key ?? "",
          }))
        )
      })
    } else {
      reset({ title: "", description: "", is_free: true, price: 0, thumbnail: "" })
      setLessons([])
    }
  }, [open, course, reset])

  function handleFreeToggle() {
    const next = !isFree
    setValue("is_free", next, { shouldValidate: true })
    if (next) setValue("price", 0, { shouldValidate: true })
  }

  async function handleNext() {
    const isValid = await trigger()
    if (isValid) setStep(2)
  }

  async function onSubmit(values: CourseFormValues) {
    let savedCourse: Course
    try {
      savedCourse = isEdit
        ? await updateCourse.mutateAsync({ id: course!.id, values })
        : await createCourse.mutateAsync(values)
    } catch {
      return // mutation error shown via mutationError below
    }

    await replaceLessons(
      savedCourse.id,
      lessons.map((l, i) => ({
        title: l.title,
        video_url: l.video_url,
        pdf_key: l.pdf_key || null,
        position: i,
      }))
    )

    onSuccess?.()
    onClose()
  }

  const mutationError = createCourse.error ?? updateCourse.error
  const modalTitle = `${isEdit ? "Edit" : "Create"} Course${step === 2 ? " — Lessons" : ""}`

  return (
    <Modal open={open} onClose={onClose} title={modalTitle} size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step indicator */}
        <div className="mb-5 flex gap-1">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                step >= s ? "bg-zinc-900" : "bg-zinc-200"
              )}
            />
          ))}
        </div>

        {/* ── Step 1: Course Info ── */}
        {step === 1 && (
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
                <label className="text-sm font-medium text-zinc-700">Price (USD) *</label>
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
                existingValue={isEdit ? (course?.thumbnail ?? null) : null}
                onUploadSuccess={({ key }) => setValue("thumbnail", key, { shouldValidate: true })}
                onUploadingChange={setThumbnailUploading}
              />
            </div>

            {mutationError && (
              <p className="text-sm text-red-500">
                {mutationError instanceof Error ? mutationError.message : "Something went wrong"}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="button" onClick={handleNext} disabled={isUploading}>
                Next →
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Lessons ── */}
        {step === 2 && (
          <div className="space-y-5">
            <LessonsEditor
              lessons={lessons}
              onChange={setLessons}
              onUploadingChange={setPdfUploading}
            />

            {mutationError && (
              <p className="text-sm text-red-500">
                {mutationError instanceof Error ? mutationError.message : "Something went wrong"}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isPending || isUploading}
              >
                ← Back
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isPending || isUploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || isUploading}>
                  {pdfUploading
                    ? "Uploading…"
                    : isPending
                      ? "Saving…"
                      : isEdit
                        ? "Save Changes"
                        : "Create Course"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
