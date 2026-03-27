"use client"

import { useState, useEffect, useTransition } from "react"
import { Heart, MessageSquare, Trash2, X } from "lucide-react"
import { getBlogEngagement, deleteComment } from "@/services/blog.service"
import type { BlogComment } from "@/services/blog.service"

interface EngagementModalProps {
  blogId: string
  blogTitle: string
  open: boolean
  onClose: () => void
}

function authorName(profile: BlogComment["profile"]) {
  if (!profile) return "Anonymous"
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ")
  return name || "User"
}

export function EngagementModal({ blogId, blogTitle, open, onClose }: EngagementModalProps) {
  const [likesCount, setLikesCount] = useState(0)
  const [comments, setComments] = useState<BlogComment[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getBlogEngagement(blogId)
      .then(({ likesCount, comments }) => {
        setLikesCount(likesCount)
        setComments(comments)
      })
      .finally(() => setLoading(false))
  }, [open, blogId])

  function handleDelete(commentId: string) {
    if (!confirm("Delete this comment? This cannot be undone.")) return
    setDeletingId(commentId)
    startTransition(async () => {
      try {
        await deleteComment(commentId)
        setComments((prev) => prev.filter((c) => c.id !== commentId))
      } catch (e) {
        alert(e instanceof Error ? e.message : "Delete failed")
      } finally {
        setDeletingId(null)
      }
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-100">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 line-clamp-1">{blogTitle}</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Engagement</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12 text-sm text-zinc-400">
            Loading…
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="flex gap-6 px-5 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-2 text-sm">
                <Heart className="size-4 text-red-400 fill-red-400" />
                <span className="font-semibold text-zinc-900">{likesCount}</span>
                <span className="text-zinc-400">likes</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="size-4 text-zinc-400" />
                <span className="font-semibold text-zinc-900">{comments.length}</span>
                <span className="text-zinc-400">comments</span>
              </div>
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-8">No comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <div className="size-7 shrink-0 rounded-full bg-zinc-100 flex items-center justify-center text-[11px] font-bold text-zinc-500 uppercase">
                      {authorName(comment.profile).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold text-zinc-900">
                            {authorName(comment.profile)}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {new Date(comment.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          disabled={deletingId === comment.id}
                          className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
