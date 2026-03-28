"use client"

import { useState, useTransition } from "react"
import { Heart } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { toggleBlogLike } from "@/services/blog.service"

interface LikeButtonProps {
  blogId: string
  initialLiked: boolean
  initialCount: number
  isLoggedIn: boolean
}

export function LikeButton({ blogId, initialLiked, initialCount, isLoggedIn }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()
  const router = useRouter()

  function handleClick() {
    if (!isLoggedIn) {
      toast.info("Please sign in to like this post.")
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }

    const wasLiked = liked

    // Optimistic update
    setLiked(!wasLiked)
    setCount((prev) => (wasLiked ? prev - 1 : prev + 1))

    startTransition(async () => {
      try {
        const result = await toggleBlogLike(blogId)
        setLiked(result.liked)
        setCount(result.count)
      } catch {
        // Revert
        setLiked(wasLiked)
        setCount((prev) => (wasLiked ? prev + 1 : prev - 1))
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={isLoggedIn ? (liked ? "Unlike" : "Like") : "Sign in to like"}
      className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
        liked
          ? "border-red-200 bg-red-50 text-red-500"
          : "border-zinc-200 bg-white text-zinc-500 hover:border-red-200 hover:text-red-400"
      } disabled:opacity-60`}
    >
      <Heart className={`size-4 transition-transform ${liked ? "fill-red-500 scale-110" : ""}`} />
      <span>{count}</span>
    </button>
  )
}
