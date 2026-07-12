"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, X, Lock, Unlock, Video } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileUploadField } from "@/components/forms/FileUploadField"
import { CroppableFileUploadField } from "@/components/forms/CroppableFileUploadField"
import { cn } from "@/lib/utils"
import {
  useLessons,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
} from "@/hooks/queries/useLessons"
import type { CourseLesson } from "@/types"

interface LessonFormState {
  id: string | null // null = new lesson
  title: string
  description: string
  thumbnail_url: string
  video_url: string
  pdf_url: string
  video_path: string
  pdf_path: string
  file_path: string
  order_index: string
  is_free: boolean
}

interface LessonFormErrors {
  title?: string
  order_index?: string
}

function emptyForm(nextPosition: number): LessonFormState {
  return { id: null, title: "", description: "", thumbnail_url: "", video_url: "", pdf_url: "", video_path: "", pdf_path: "", file_path: "", order_index: String(nextPosition), is_free: false }
}

function LessonForm({
  form,
  errors,
  onChange,
  onClose,
  onSave,
  isPending,
}: {
  form: LessonFormState
  errors: LessonFormErrors
  onChange: (f: LessonFormState) => void
  onClose: () => void
  onSave: () => void
  isPending: boolean
}) {
  const [fileUploading, setFileUploading] = useState(false)

  const anyUploading = fileUploading

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-800">
          {form.id ? "Edit Lesson" : "New Lesson"}
        </p>
        <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
          <X className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-zinc-600">Title *</label>
          <Input
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            placeholder="Lesson title"
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-600">Order index *</label>
          <Input
            type="number"
            min="0"
            value={form.order_index}
            onChange={(e) => onChange({ ...form, order_index: e.target.value })}
            placeholder="0"
          />
          {errors.order_index && <p className="text-xs text-red-500">{errors.order_index}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-600">Description (optional)</label>
        <Textarea
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="Short description of this session…"
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-600">Thumbnail (optional)</label>
        <CroppableFileUploadField
          folder="courses/lessons/thumbnails"
          aspect={16 / 9}
          label="Click to upload thumbnail"
          existingValue={form.thumbnail_url || null}
          onUploadSuccess={({ key }) => onChange({ ...form, thumbnail_url: key })}
          onUploadingChange={setFileUploading}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-600">Video URL (optional)</label>
        <Input
          value={form.video_url}
          onChange={(e) => onChange({ ...form, video_url: e.target.value })}
          placeholder="https://youtube.com/watch?v=…"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-600">Video file (optional)</label>
        <FileUploadField
          folder="courses/videos"
          accept="video/*"
          label="Click to upload video"
          existingValue={form.video_path || null}
          onUploadSuccess={({ key }) => onChange({ ...form, video_path: key })}
          onUploadingChange={setFileUploading}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-600">PDF file (optional)</label>
        <FileUploadField
          folder="courses/pdfs"
          accept=".pdf"
          label="Click to upload PDF"
          existingValue={form.pdf_path || form.pdf_url || null}
          onUploadSuccess={({ key }) => onChange({ ...form, pdf_path: key })}
          onUploadingChange={setFileUploading}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-600">Attachment file (optional)</label>
        <FileUploadField
          folder="courses/files"
          accept="*"
          label="Click to upload file"
          existingValue={form.file_path || null}
          onUploadSuccess={({ key }) => onChange({ ...form, file_path: key })}
          onUploadingChange={setFileUploading}
        />
      </div>

      {/* is_free toggle */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-medium text-zinc-800">Free preview</p>
          <p className="text-xs text-zinc-500">Students can watch without purchasing</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.is_free}
          onClick={() => onChange({ ...form, is_free: !form.is_free })}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
            form.is_free ? "bg-zinc-900" : "bg-zinc-200"
          )}
        >
          <span
            className={cn(
              "inline-block size-4 rounded-full bg-white shadow transition-transform",
              form.is_free ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending || anyUploading}>
          Cancel
        </Button>
        <Button type="button" onClick={onSave} disabled={isPending || anyUploading}>
          {anyUploading ? "Uploading…" : isPending ? "Saving…" : form.id ? "Save Changes" : "Add Lesson"}
        </Button>
      </div>
    </div>
  )
}

function LessonRow({
  lesson,
  onEdit,
  onDelete,
  isDeleting,
}: {
  lesson: CourseLesson
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-zinc-50 transition-colors">
      <span className="w-7 shrink-0 text-center text-xs font-medium text-zinc-400 tabular-nums">
        {lesson.order_index}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 line-clamp-1">{lesson.title}</p>
        {(lesson.video_url || lesson.video_path) && (
          <p className="text-xs text-zinc-400 line-clamp-1 flex items-center gap-1 mt-0.5">
            <Video className="size-3 shrink-0" />
            {lesson.video_url || lesson.video_path}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {(lesson.pdf_url || lesson.pdf_path) && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
            PDF
          </span>
        )}
        {lesson.file_path && (
          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600">
            File
          </span>
        )}
        {lesson.is_free ? (
          <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
            <Unlock className="size-2.5" />
            Free
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
            <Lock className="size-2.5" />
            Paid
          </span>
        )}
        <button
          onClick={onEdit}
          className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

export function LessonsManager({ courseId }: { courseId: string }) {
  const { data: lessons = [], isLoading } = useLessons(courseId)
  const createMutation = useCreateLesson(courseId)
  const updateMutation = useUpdateLesson(courseId)
  const deleteMutation = useDeleteLesson(courseId)

  const [form, setForm] = useState<LessonFormState | null>(null)
  const [formErrors, setFormErrors] = useState<LessonFormErrors>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const isPending = createMutation.isPending || updateMutation.isPending

  function openAdd() {
    const nextPos = lessons.length > 0 ? Math.max(...lessons.map((l) => l.order_index)) + 1 : 0
    setForm(emptyForm(nextPos))
    setFormErrors({})
  }

  function openEdit(lesson: CourseLesson) {
    setForm({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description ?? "",
      thumbnail_url: lesson.thumbnail_url ?? "",
      video_url: lesson.video_url ?? "",
      pdf_url: lesson.pdf_url ?? "",
      video_path: lesson.video_path ?? "",
      pdf_path: lesson.pdf_path ?? "",
      file_path: lesson.file_path ?? "",
      order_index: String(lesson.order_index),
      is_free: lesson.is_free,
    })
    setFormErrors({})
  }

  function closeForm() {
    setForm(null)
    setFormErrors({})
  }

  function validate(f: LessonFormState): LessonFormErrors {
    const errs: LessonFormErrors = {}
    if (!f.title.trim()) errs.title = "Title is required"
    const pos = Number(f.order_index)
    if (f.order_index === "" || isNaN(pos) || pos < 0) errs.order_index = "Must be a number ≥ 0"
    return errs
  }

  async function handleSave() {
    if (!form) return
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      return
    }
    const input = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      thumbnail_url: form.thumbnail_url || null,
      video_url: form.video_url.trim() || null,
      pdf_url: form.pdf_url || null,
      video_path: form.video_path || null,
      pdf_path: form.pdf_path || null,
      file_path: form.file_path || null,
      order_index: Number(form.order_index),
      is_free: form.is_free,
    }
    try {
      if (form.id) {
        await updateMutation.mutateAsync({ id: form.id, input })
      } else {
        await createMutation.mutateAsync(input)
      }
      closeForm()
    } catch {
      // error displayed in button state
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteMutation.mutateAsync(id)
    } finally {
      setDeletingId(null)
    }
  }

  const mutationError = createMutation.error ?? updateMutation.error

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Lessons</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isLoading ? "Loading…" : `${lessons.length} lesson${lessons.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {!form && (
          <Button type="button" onClick={openAdd} variant="outline" className="gap-1.5">
            <Plus className="size-4" />
            Add Lesson
          </Button>
        )}
      </div>

      {/* Add / Edit form */}
      {form && (
        <LessonForm
          form={form}
          errors={formErrors}
          onChange={setForm}
          onClose={closeForm}
          onSave={handleSave}
          isPending={isPending}
        />
      )}

      {mutationError && (
        <p className="text-sm text-red-500">
          {mutationError instanceof Error ? mutationError.message : "Something went wrong"}
        </p>
      )}

      {/* Lesson list */}
      {!isLoading && lessons.length > 0 && (
        <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 overflow-hidden">
          {lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              onEdit={() => openEdit(lesson)}
              onDelete={() => handleDelete(lesson.id)}
              isDeleting={deletingId === lesson.id}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && lessons.length === 0 && !form && (
        <button
          type="button"
          onClick={openAdd}
          className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 text-sm text-zinc-400 hover:border-zinc-300 hover:text-zinc-500 transition-colors"
        >
          <Plus className="size-5" />
          Add your first lesson
        </button>
      )}
    </div>
  )
}
