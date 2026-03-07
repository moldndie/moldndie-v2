"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ImageUploadField } from "@/components/forms/ImageUploadField"
import { CategoryModal } from "@/components/modals/CategoryModal"
import { TagModal } from "@/components/modals/TagModal"
import { blogSchema, type BlogFormValues } from "@/schemas/blog.schema"
import { createBlog, updateBlog, saveBlogBlocks, saveBlogTags } from "@/services/blog.service"
import { createClient } from "@/lib/supabase/client"
import type { Blog, BlogCategory, BlogTag } from "@/types"
import type { EditorBlock } from "../types"
import { BlockEditor } from "./BlockEditor"

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
  const [blocks, setBlocks] = useState<EditorBlock[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Local state for immediate dropdown sync after inline creation
  const [localCategories, setLocalCategories] = useState<BlogCategory[]>(categories)
  const [localTags, setLocalTags] = useState<BlogTag[]>(tags)

  // Cover image: File for new selection, string for existing URL
  const [coverFile, setCoverFile] = useState<File | null>(null)

  // Tags chip-toggle
  const [pickedTagIds, setPickedTagIds] = useState<string[]>(selectedTagIds)

  // Inline creation modals
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
      excerpt: blog?.excerpt ?? "",
      cover_image: blog?.cover_image ?? "",
      category_id: blog?.category_id ?? "",
      published: blog?.published ?? false,
    },
  })

  const titleValue = watch("title")
  const coverImageUrl = watch("cover_image")

  useEffect(() => {
    if (!isEdit && titleValue) {
      setValue("slug", slugify(titleValue), { shouldValidate: false })
    }
  }, [titleValue, isEdit, setValue])

  useEffect(() => {
    if (blog?.blocks) {
      setBlocks(
        [...blog.blocks]
          .sort((a, b) => a.position - b.position)
          .map((b) => ({ id: b.id, type: b.type, content: b.content }))
      )
    }
  }, [blog])

  function toggleTag(id: string) {
    setPickedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  async function uploadCover(file: File): Promise<string> {
    const supabase = createClient()
    const ext = file.name.split(".").pop()
    const path = `covers/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(path, file, { upsert: true })
    if (uploadError) throw new Error(uploadError.message)
    const { data } = supabase.storage.from("blog-images").getPublicUrl(path)
    return data.publicUrl
  }

  async function onSubmit(values: BlogFormValues) {
    setSaving(true)
    setError(null)
    try {
      let coverUrl = values.cover_image ?? ""
      if (coverFile) {
        coverUrl = await uploadCover(coverFile)
      }

      const saved = isEdit
        ? await updateBlog(blog!.id, { ...values, cover_image: coverUrl })
        : await createBlog({ ...values, cover_image: coverUrl })

      await saveBlogBlocks(
        saved.id,
        blocks.map((b, i) => ({ type: b.type, content: b.content, position: i }))
      )
      await saveBlogTags(saved.id, pickedTagIds)

      router.push("/dashboard/blogs")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setSaving(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
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
              <label className="text-sm font-medium text-zinc-700">Excerpt</label>
              <Textarea {...register("excerpt")} placeholder="Short description…" rows={3} />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900">Content Blocks</h3>
              <BlockEditor value={blocks} onChange={setBlocks} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-zinc-900">Cover Image</p>
              <ImageUploadField
                value={coverFile ?? (coverImageUrl || null)}
                onChange={(file) => {
                  setCoverFile(file)
                  if (!file) setValue("cover_image", "")
                }}
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
                  id="published"
                  {...register("published")}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <label htmlFor="published" className="text-sm text-zinc-700">
                  Published
                </label>
              </div>
            </div>

            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Blog"}
              </Button>
              <Button
                type="button"
                variant="outline"
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
