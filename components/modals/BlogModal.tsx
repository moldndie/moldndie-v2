"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CroppableFileUploadField } from "@/components/forms/CroppableFileUploadField"
import { blogSchema, type BlogFormValues } from "@/schemas/blog.schema"
import { useCreateBlog, useUpdateBlog } from "@/hooks/queries/useBlog"
import { saveBlogBlocks } from "@/services/blog.service"
import type { Blog, BlogCategory } from "@/types"

interface ContentBlock {
  block_type: "heading" | "paragraph" | "image"
  content: string
}

interface BlogModalProps {
  open: boolean
  onClose: () => void
  blog?: Blog | null
  categories: BlogCategory[]
  onSuccess?: () => void
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

const BLOCK_LABELS = { heading: "Heading", paragraph: "Paragraph", image: "Image URL" }

export function BlogModal({ open, onClose, blog, categories, onSuccess }: BlogModalProps) {
  const isEdit = !!blog

  const createBlog = useCreateBlog()
  const updateBlog = useUpdateBlog()
  const isPending = createBlog.isPending || updateBlog.isPending

  const [coverUploading, setCoverUploading] = useState(false)
  const [blocks, setBlocks] = useState<ContentBlock[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      slug: "",
      introduction: "",
      cover_image_path: "",
      category_id: "",
      is_published: false,
    },
  })

  const titleValue = watch("title")

  useEffect(() => {
    if (!isEdit && titleValue) {
      setValue("slug", slugify(titleValue), { shouldValidate: false })
    }
  }, [titleValue, isEdit, setValue])

  useEffect(() => {
    if (!open) {
      setCoverUploading(false)
      return
    }
    if (blog) {
      reset({
        title: blog.title,
        slug: blog.slug,
        introduction: blog.introduction ?? "",
        cover_image_path: blog.cover_image_path ?? "",
        category_id: blog.category_id ?? "",
        is_published: blog.is_published,
      })
      setBlocks(
        (blog.blocks ?? [])
          .sort((a, b) => a.order_index - b.order_index)
          .map((b) => ({
            block_type: b.block_type as ContentBlock["block_type"],
            content: String((b.content as { text?: string }).text ?? ""),
          }))
      )
    } else {
      reset({ title: "", slug: "", introduction: "", cover_image_path: "", category_id: "", is_published: false })
      setBlocks([])
    }
  }, [open, blog, reset])

  function addBlock(block_type: ContentBlock["block_type"]) {
    setBlocks((prev) => [...prev, { block_type, content: "" }])
  }

  function updateBlock(index: number, content: string) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, content } : b)))
  }

  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index))
  }

  async function onSubmit(values: BlogFormValues) {
    let saved: Blog
    try {
      saved = isEdit
        ? await updateBlog.mutateAsync({ id: blog!.id, values })
        : await createBlog.mutateAsync(values)
    } catch {
      return
    }

    try {
      await saveBlogBlocks(
        saved.id,
        blocks.map((b, i) => ({
          block_type: b.block_type,
          content: { text: b.content },
          order_index: i,
        }))
      )
    } catch (e) {
      console.error("Failed to save blocks:", e)
    }

    onSuccess?.()
    onClose()
  }

  const mutationError = createBlog.error ?? updateBlog.error

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Blog" : "Create Blog"}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Title *</label>
          <Input {...register("title")} placeholder="Blog title" />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Slug *</label>
          <Input {...register("slug")} placeholder="my-blog-post" />
          {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
        </div>

        {/* Introduction */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Introduction</label>
          <Textarea {...register("introduction")} placeholder="Short description…" rows={3} />
        </div>

        {/* Cover image */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Cover Image</label>
          <CroppableFileUploadField
            folder="blogs/covers"
            aspect={16 / 9}
            label="Click to upload cover image"
            existingValue={isEdit ? (blog?.cover_image_path ?? null) : null}
            onUploadSuccess={({ key }) => setValue("cover_image_path", key, { shouldValidate: true })}
            onUploadingChange={setCoverUploading}
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Category</label>
          <Select {...register("category_id")}>
            <option value="">— No category —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>

        {/* Published */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_published"
            {...register("is_published")}
            className="h-4 w-4 rounded border-zinc-300"
          />
          <label htmlFor="is_published" className="text-sm font-medium text-zinc-700">
            Published
          </label>
        </div>

        {/* Block Editor */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Content Blocks</h3>
            <div className="flex gap-2">
              {(["heading", "paragraph", "image"] as ContentBlock["block_type"][]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addBlock(t)}
                  className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                >
                  <Plus className="size-3" />
                  {BLOCK_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {blocks.length === 0 && (
            <p className="rounded-lg border border-dashed border-zinc-200 py-6 text-center text-sm text-zinc-400">
              Add content blocks above
            </p>
          )}

          <div className="space-y-2">
            {blocks.map((block, i) => (
              <div key={i} className="flex gap-2 rounded-lg border border-zinc-200 p-3">
                <GripVertical className="mt-1 size-4 shrink-0 text-zinc-300" />
                <div className="flex-1 space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    {BLOCK_LABELS[block.block_type]}
                  </span>
                  {block.block_type === "paragraph" ? (
                    <Textarea
                      value={block.content}
                      onChange={(e) => updateBlock(i, e.target.value)}
                      placeholder="Enter text…"
                      rows={3}
                    />
                  ) : (
                    <Input
                      value={block.content}
                      onChange={(e) => updateBlock(i, e.target.value)}
                      placeholder={block.block_type === "image" ? "https://…" : "Heading text"}
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeBlock(i)}
                  className="mt-1 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-500"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {mutationError && (
          <p className="text-sm text-red-500">
            {mutationError instanceof Error ? mutationError.message : "Something went wrong"}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={coverUploading || isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={coverUploading || isPending}>
            {coverUploading
              ? "Uploading…"
              : isPending
                ? "Saving…"
                : isEdit
                  ? "Save Changes"
                  : "Create Blog"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
