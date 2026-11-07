import type { ImagePlacement } from "./article-image"

export const MIN_VIDEO_WIDTH_PERCENT = 25
export const MAX_VIDEO_WIDTH_PERCENT = 100
export const MAX_WRAPPED_VIDEO_WIDTH_PERCENT = 80

export function getVideoPlacement(value: unknown): ImagePlacement {
  return value === "left" || value === "right" ? value : "block"
}

export function getVideoWidthPercent(value: unknown, placement: ImagePlacement = "block"): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined
  if (typeof value === "string" && !value.trim()) return undefined
  const width = Number(value)
  if (!Number.isFinite(width)) return undefined
  const max = placement === "block" ? MAX_VIDEO_WIDTH_PERCENT : MAX_WRAPPED_VIDEO_WIDTH_PERCENT
  return Math.min(max, Math.max(MIN_VIDEO_WIDTH_PERCENT, Math.round(width)))
}

export function isUploadedArticleVideo(attrs: Record<string, unknown>) {
  return attrs.kind === "file" && typeof attrs.file_path === "string" && !!attrs.file_path &&
    typeof attrs.file_type === "string" && attrs.file_type.startsWith("video/")
}
