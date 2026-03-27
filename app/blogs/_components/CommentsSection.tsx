"use client"

import { useState, useRef, useTransition } from "react"
import { MessageSquare, Send } from "lucide-react"
import { addBlogComment, type BlogComment } from "@/services/blog.service"

interface CommentsSectionProps {
  blogId: string
  initialComments: BlogComment[]
  currentUserId: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function authorName(profile: BlogComment["profile"]) {
  if (!profile) return "Anonymous"
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ")
  return name || "User"
}

export function CommentsSection({ blogId, initialComments, currentUserId }: CommentsSectionProps) {
  const [comments, setComments] = useState<BlogComment[]>(initialComments)
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = content.trim()
    if (!text) return
    setError(null)

    startTransition(async () => {
      try {
        const comment = await addBlogComment(blogId, text)
        setComments((prev) => [comment, ...prev])
        setContent("")
        textareaRef.current?.focus()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to post comment")
      }
    })
  }

  return (
    <section className="mt-12 pt-8 border-t border-zinc-100">
      <h2 className="flex items-center gap-2 text-base font-bold text-zinc-900 mb-6">
        <MessageSquare className="size-4" />
        Comments
        {comments.length > 0 && (
          <span className="text-sm font-normal text-zinc-400">({comments.length})</span>
        )}
      </h2>

      {/* Form */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mb-8 space-y-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment…"
            rows={3}
            maxLength={2000}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">{content.length}/2000</span>
            <button
              type="submit"
              disabled={isPending || !content.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send className="size-3.5" />
              {isPending ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-8 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
          Sign in to leave a comment.
        </p>
      )}

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-sm text-zinc-400 text-center py-8">No comments yet. Be the first!</p>
      ) : (
        <ul className="space-y-5">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              {/* Avatar */}
              <div className="size-8 shrink-0 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-500 uppercase">
                {authorName(comment.profile).charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-semibold text-zinc-900">
                    {authorName(comment.profile)}
                  </span>
                  <span className="text-xs text-zinc-400">{formatDate(comment.created_at)}</span>
                </div>
                <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
