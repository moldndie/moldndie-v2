"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FileUploadField } from "@/components/forms/FileUploadField"
import RichTextEditor from "@/components/editor/RichTextEditor"
import { toDoc, fromDoc } from "@/lib/richtext"
import { CategoryModal } from "@/components/modals/CategoryModal"
import { TagModal } from "@/components/modals/TagModal"
import { blogSchema, type BlogFormValues } from "@/schemas/blog.schema"
import { useCreateBlog, useUpdateBlog } from "@/hooks/queries/useBlog"
import { saveBlogBlocks, saveBlogTags } from "@/services/blog.service"
import type { Blog, BlogCategory, BlogTag } from "@/types"
import type { EditorBlock } from "../types"
import { SectionLayoutBuilder } from "./SectionLayoutBuilder"

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

interface BlogFormProps {
  blog?: Blog
  categories: BlogCategory[]
  tags: BlogTag[]
  selectedTagIds?: string[]
}

export function BlogForm({ blog, categories, tags, selectedTagIds = [] }: BlogFormProps) {
  const router = useRouter()
  const isEdit = !!blog

  const createBlog = useCreateBlog()
  const updateBlog = useUpdateBlog()
  const isPending = createBlog.isPending || updateBlog.isPending

  const [coverUploading, setCoverUploading] = useState(false)
  const [blocks, setBlocks] = useState<EditorBlock[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [localCategories, setLocalCategories] = useState<BlogCategory[]>(categories)
  const [localTags, setLocalTags] = useState<BlogTag[]>(tags)
  const [pickedTagIds, setPickedTagIds] = useState<string[]>(selectedTagIds)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [tagModalOpen, setTagModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: blog?.title ?? "",
      slug: blog?.slug ?? "",
      introduction: blog?.introduction ?? "",
      cover_image_path: blog?.cover_image_path ?? "",
      category_id: blog?.category_id ?? "",
      is_published: blog?.is_published ?? false,
    },
  })

  const titleValue = watch("title")

  useEffect(() => {
    if (submitError) setSubmitError(null)
    if (!isEdit && titleValue) {
      setValue("slug", slugify(titleValue), { shouldValidate: false })
    }
  }, [titleValue, isEdit, setValue])

  useEffect(() => {
    if (blog?.blocks) {
      setBlocks(
        [...blog.blocks]
          .sort((a, b) => a.order_index - b.order_index)
          .map((b) => ({ id: b.id, block_type: b.block_type, content: b.content, layout: b.layout ?? null, column_position: b.column_position ?? null, column_ratio: b.column_ratio ?? null }))
      )
    }
  }, [blog])

  function toggleTag(id: string) {
    setPickedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  async function onSubmit(values: BlogFormValues) {
    setSubmitError(null)
    let saved: Blog
    try {
      saved = isEdit
        ? await updateBlog.mutateAsync({ id: blog!.id, values })
        : await createBlog.mutateAsync(values)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to save blog")
      return
    }

    // Independent saves, and neither one failing silently: these used to share a
    // try/catch that swallowed the error, so a blocks failure skipped the tag
    // save and the post looked like it had saved cleanly.
    const failures: string[] = []
    try {
      await saveBlogBlocks(saved.id, blocks.map((b, i) => ({ block_type: b.block_type, content: b.content, order_index: i, layout: b.layout ?? null, column_position: b.column_position ?? null, column_ratio: b.column_ratio ?? null })))
    } catch (e) {
      failures.push(`content (${e instanceof Error ? e.message : "unknown error"})`)
    }
    try {
      await saveBlogTags(saved.id, pickedTagIds)
    } catch (e) {
      failures.push(`tags (${e instanceof Error ? e.message : "unknown error"})`)
    }

    if (failures.length > 0) {
      setSubmitError(`The post was saved, but ${failures.join(" and ")} could not be saved.`)
      return
    }

    router.refresh()
    router.push("/dashboard/blogs")
  }

  const mutationError = createBlog.error ?? updateBlog.error

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, (errs) => {
          console.error("[BlogForm] validation errors:", errs)
          setSubmitError("Please fix the highlighted fields above.")
        })}>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Title *</label>
              <Input {...register("title")} placeholder="Blog title" />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Slug *</label>
              <Input {...register("slug")} placeholder="my-blog-post" className="font-mono text-sm" />
              {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Introduction</label>
              <RichTextEditor
                value={toDoc(watch("introduction"))}
                onChange={(doc) => setValue("introduction", fromDoc(doc), { shouldDirty: true })}
                placeholder="Short description…"
                minHeight={120}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900">Content</h3>
              <SectionLayoutBuilder value={blocks} onChange={setBlocks} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-zinc-900">Cover Image</p>
              <FileUploadField
                folder="blogs/covers"
                accept="image/*"
                label="Click to upload cover image"
                existingValue={watch("cover_image_path") || null}
                onUploadSuccess={({ key }) => setValue("cover_image_path", key, { shouldValidate: true })}
                onClear={() => setValue("cover_image_path", "", { shouldValidate: true })}
                onUploadingChange={setCoverUploading}
              />
            </div>

            <div className="rounded-xl border border-zinc-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-900">Category</p>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(true)}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
                >
                  <Plus className="size-3" />
                  New
                </button>
              </div>
              <Select {...register("category_id")}>
                <option value="">— No category —</option>
                {localCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="rounded-xl border border-zinc-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-900">Tags</p>
                <button
                  type="button"
                  onClick={() => setTagModalOpen(true)}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
                >
                  <Plus className="size-3" />
                  New
                </button>
              </div>
              {localTags.length === 0 ? (
                <p className="text-xs text-zinc-400">No tags yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {localTags.map((tag) => {
                    const active = pickedTagIds.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          active
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                        }`}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-zinc-900">Publish</p>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  {...register("is_published")}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <label htmlFor="is_published" className="text-sm text-zinc-700">
                  Published
                </label>
              </div>
            </div>

            {(mutationError || submitError) && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {mutationError instanceof Error
                  ? mutationError.message
                  : submitError ?? "Something went wrong"}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={coverUploading || isPending}>
                {coverUploading
                  ? "Uploading…"
                  : isPending
                    ? "Saving…"
                    : isEdit
                      ? "Save Changes"
                      : "Create Blog"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={coverUploading || isPending}
                onClick={() => router.push("/dashboard/blogs")}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>

      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onCreated={(cat) => {
          setLocalCategories((prev) =>
            [...prev, cat].sort((a, b) => a.name.localeCompare(b.name))
          )
          setValue("category_id", cat.id)
        }}
        onSuccess={() => setCategoryModalOpen(false)}
      />

      <TagModal
        open={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        onCreated={(tag) => {
          setLocalTags((prev) =>
            [...prev, tag].sort((a, b) => a.name.localeCompare(b.name))
          )
          setPickedTagIds((prev) => [...prev, tag.id])
        }}
        onSuccess={() => setTagModalOpen(false)}
      />
    </>
  )
}
