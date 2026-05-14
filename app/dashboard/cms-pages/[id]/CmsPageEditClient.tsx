"use client"

import { useState, useTransition, lazy, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Save, Globe, EyeOff, Eye } from "lucide-react"
import { cmsPageSchema, type CmsPageFormValues } from "@/schemas/cmsPage.schema"
import { updateCmsPage, setCmsPagePublished } from "@/services/cmsPage.service"
import type { CmsPage } from "@/services/cmsPage.service"
import { cn } from "@/lib/utils"

const RichTextEditor = lazy(() => import("@/components/editor/RichTextEditor"))

interface Props {
  page: CmsPage
}

export default function CmsPageEditClient({ page }: Props) {
  const router = useRouter()
  const [content, setContent] = useState<Record<string, unknown> | null>(page.content)
  const [isPublished, setIsPublished] = useState(page.is_published)
  const [isPending, startTransition] = useTransition()
  const [isPublishing, startPublishing] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CmsPageFormValues>({
    resolver: zodResolver(cmsPageSchema),
    defaultValues: {
      title: page.title,
      slug: page.slug,
      content: page.content ?? undefined,
      seo_title: page.seo_title ?? "",
      seo_description: page.seo_description ?? "",
      is_published: page.is_published,
    },
  })

  function onSubmit(values: CmsPageFormValues) {
    startTransition(async () => {
      try {
        await updateCmsPage(page.id, { ...values, content: content ?? undefined })
        toast.success("Page saved successfully.")
        router.refresh()
      } catch (e) {
        toast.error((e as Error).message || "Failed to save page.")
      }
    })
  }

  function togglePublish() {
    const next = !isPublished
    startPublishing(async () => {
      try {
        await setCmsPagePublished(page.id, next, page.slug)
        setIsPublished(next)
        toast.success(next ? "Page published and live." : "Page unpublished.")
        router.refresh()
      } catch (e) {
        toast.error((e as Error).message || "Failed to update publish state.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center gap-2">
          {isPublished ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">
              <EyeOff className="size-3" />
              Draft
            </span>
          )}
          <a
            href={`/${page.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Globe className="size-3" />
            View page
          </a>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePublish}
            disabled={isPublishing}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60",
              isPublished
                ? "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            )}
          >
            {isPublished ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            {isPublishing ? "Updating…" : isPublished ? "Unpublish" : "Publish"}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-60 transition-colors"
          >
            <Save className="size-3.5" />
            {isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">Page Content</h2>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Page Title</label>
              <input
                {...register("title")}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                placeholder="Privacy Policy"
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Content</label>
              <Suspense
                fallback={
                  <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-400">
                    Loading editor…
                  </div>
                }
              >
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Write the page content here…"
                  minHeight={500}
                />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Sidebar: SEO + settings */}
        <div className="space-y-5">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">Page Settings</h2>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">URL Slug</label>
              <div className="flex items-center rounded-lg border border-zinc-200 overflow-hidden">
                <span className="px-3 py-2.5 text-xs text-zinc-400 bg-zinc-50 border-r border-zinc-200 shrink-0">
                  moldndie.com/
                </span>
                <input
                  {...register("slug")}
                  className="flex-1 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none"
                  placeholder="privacy-policy"
                />
              </div>
              {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
              <p className="text-xs text-zinc-400">Changing the slug changes the page URL.</p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">SEO</h2>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">SEO Title</label>
              <input
                {...register("seo_title")}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                placeholder="Leave blank to use page title"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Meta Description</label>
              <textarea
                {...register("seo_description")}
                rows={3}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                placeholder="Short description for search engines (150–160 chars)"
              />
              <p className="text-xs text-zinc-400">Shown in Google search results.</p>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
