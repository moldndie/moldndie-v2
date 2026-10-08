import { getFileUrl } from "@/lib/utils"

export function getYouTubeEmbedUrl(url: string): string | null {
  const short = url.match(/youtu\.be\/([^?&]+)/)
  if (short) return `https://www.youtube.com/embed/${short[1]}?rel=0&modestbranding=1`
  const long = url.match(/[?&]v=([^&]+)/)
  if (long) return `https://www.youtube.com/embed/${long[1]}?rel=0&modestbranding=1`
  return null
}

/** R2 key or legacy full URL -> displayable URL. */
export function mediaUrl(v: string): string {
  return v.startsWith("http") ? v : getFileUrl(v)
}
