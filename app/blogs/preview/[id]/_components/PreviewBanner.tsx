"use client"

import { Eye, Pencil, Globe, EyeOff, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSetBlogPublished } from "@/hooks/queries/useBlog"

interface PreviewBannerProps {
  blogId: string
  blogSlug: string
  isPublished: boolean
}

export function PreviewBanner({ blogId, blogSlug, isPublished }: PreviewBannerProps) {
  const router = useRouter()
  const setPublished = useSetBlogPublished()

  async function handleToggle() {
    await setPublished.mutateAsync({ id: blogId, published: !isPublished })
    router.refresh()
  }

  return (
    <div className="fixed top-0 inset-x-0 z-50 w-full flex items-center gap-2.5 bg-white border-b border-zinc-200 px-4 py-2 shadow-sm">
      {/* Left: mode indicator */}
      <Eye className="size-3.5 text-zinc-400 shrink-0" />
      <span className="text-xs font-semibold text-zinc-500 tracking-wide">Preview</span>

      {/* Status badge */}
      {isPublished ? (
        <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
          Published
        </span>
      ) : (
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
          Draft
        </span>
      )}

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Edit */}
        <a
          href={`/dashboard/blogs/${blogId}/edit`}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
        >
          <Pencil className="size-3" />
          Edit
        </a>

        {/* Publish / Unpublish */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={setPublished.isPending}
          className={[
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
            isPublished
              ? "text-zinc-600 hover:bg-zinc-100"
              : "bg-zinc-900 text-white hover:bg-zinc-700",
          ].join(" ")}
        >
          {isPublished ? <EyeOff className="size-3" /> : <Globe className="size-3" />}
          {setPublished.isPending ? "Saving…" : isPublished ? "Unpublish" : "Publish"}
        </button>

        {/* View live — only when published */}
        {isPublished && (
          <a
            href={`/blogs/${blogSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <ExternalLink className="size-3" />
            View Live
          </a>
        )}
      </div>
    </div>
  )
}
