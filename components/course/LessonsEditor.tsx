"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileUploadField } from "@/components/forms/FileUploadField"

export interface LocalLesson {
  id?: string // undefined = new, not yet in DB
  title: string
  video_url: string
  pdf_url: string
}

interface FormState {
  index: number | null // null = adding new
  title: string
  video_url: string
  pdf_url: string
}

interface LessonsEditorProps {
  lessons: LocalLesson[]
  onChange: (lessons: LocalLesson[]) => void
  onUploadingChange: (uploading: boolean) => void
}

export function LessonsEditor({ lessons, onChange, onUploadingChange }: LessonsEditorProps) {
  const [form, setForm] = useState<FormState | null>(null)
  const [formErrors, setFormErrors] = useState<{ title?: string; video_url?: string }>({})

  function openAdd() {
    setForm({ index: null, title: "", video_url: "", pdf_url: "" })
    setFormErrors({})
  }

  function openEdit(index: number) {
    const l = lessons[index]
    setForm({ index, title: l.title, video_url: l.video_url, pdf_url: l.pdf_url })
    setFormErrors({})
  }

  function closeForm() {
    setForm(null)
    setFormErrors({})
  }

  function handleSave() {
    if (!form) return
    const errors: typeof formErrors = {}
    if (!form.title.trim()) errors.title = "Title is required"
    if (!form.video_url.trim()) errors.video_url = "Video URL is required"
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    const lesson: LocalLesson = {
      id: form.index !== null ? lessons[form.index].id : undefined,
      title: form.title.trim(),
      video_url: form.video_url.trim(),
      pdf_url: form.pdf_url,
    }
    if (form.index !== null) {
      onChange(lessons.map((l, i) => (i === form.index ? lesson : l)))
    } else {
      onChange([...lessons, lesson])
    }
    closeForm()
  }

  function handleDelete(index: number) {
    onChange(lessons.filter((_, i) => i !== index))
  }

  function handleMove(index: number, dir: -1 | 1) {
    const next = index + dir
    if (next < 0 || next >= lessons.length) return
    const arr = [...lessons]
    ;[arr[index], arr[next]] = [arr[next], arr[index]]
    onChange(arr)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
        </p>
        {!form && (
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            <Plus className="size-3.5" />
            Add Lesson
          </button>
        )}
      </div>

      {/* Lesson list */}
      {lessons.length > 0 && (
        <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 overflow-hidden">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id ?? index}
              className="flex items-center gap-3 px-3 py-2.5 bg-white"
            >
              {/* Reorder buttons */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleMove(index, -1)}
                  disabled={index === 0}
                  className="text-zinc-300 hover:text-zinc-500 disabled:opacity-20"
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 1)}
                  disabled={index === lessons.length - 1}
                  className="text-zinc-300 hover:text-zinc-500 disabled:opacity-20"
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </div>

              <span className="w-5 shrink-0 text-center text-xs text-zinc-400">{index + 1}</span>
              <span className="flex-1 text-sm font-medium text-zinc-800 line-clamp-1">
                {lesson.title}
              </span>
              {lesson.pdf_url && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">
                  PDF
                </span>
              )}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(index)}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {lessons.length === 0 && !form && (
        <button
          type="button"
          onClick={openAdd}
          className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 text-sm text-zinc-400 hover:border-zinc-300 hover:text-zinc-500 transition-colors"
        >
          <Plus className="size-4" />
          Add your first lesson
        </button>
      )}

      {/* Inline lesson form */}
      {form && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-700">
              {form.index !== null ? "Edit Lesson" : "New Lesson"}
            </p>
            <button
              type="button"
              onClick={closeForm}
              className="text-zinc-400 hover:text-zinc-600"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600">Title *</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Lesson title"
            />
            {formErrors.title && <p className="text-xs text-red-500">{formErrors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600">Video URL *</label>
            <Input
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=…"
            />
            {formErrors.video_url && (
              <p className="text-xs text-red-500">{formErrors.video_url}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600">PDF (optional)</label>
            <FileUploadField
              folder="courses/pdfs"
              accept=".pdf"
              label="Click to upload PDF"
              existingValue={form.pdf_url || null}
              onUploadSuccess={({ key }) => setForm((f) => (f ? { ...f, pdf_url: key } : f))}
              onClear={() => setForm((f) => (f ? { ...f, pdf_url: "" } : f))}
              onUploadingChange={onUploadingChange}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              {form.index !== null ? "Update Lesson" : "Add Lesson"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
