"use client"

import { ExternalLink, FileText, RefreshCw, Trash2 } from "lucide-react"
import { cn, getFileUrl } from "@/lib/utils"

const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"]
const VIDEO_EXT = ["mp4", "webm", "mov", "m4v", "ogv"]

function kindOf(key: string): "image" | "video" | "pdf" | "file" {
  const ext = key.split("?")[0].split(".").pop()?.toLowerCase() ?? ""
  if (IMAGE_EXT.includes(ext)) return "image"
  if (VIDEO_EXT.includes(ext)) return "video"
  if (ext === "pdf") return "pdf"
  return "file"
}

interface FilePreviewProps {
  /** R2 object key, or a full URL for legacy records */
  value: string
  /** Omit to hide the Replace button (e.g. gallery items, which are add/remove only) */
  onReplace?: () => void
  /** Omit to hide the Remove button */
  onClear?: () => void
  /** Shown above the actions when a fresh upload just finished */
  justUploaded?: boolean
  className?: string
}

export function FilePreview({
  value,
  onReplace,
  onClear,
  justUploaded,
  className,
}: FilePreviewProps) {
  const url = value.startsWith("http") ? value : getFileUrl(value)
  const kind = kindOf(value)
  const name = value.split("/").pop() ?? value

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border",
        justUploaded ? "border-green-200 bg-green-50" : "border-zinc-200 bg-zinc-50",
        className,
      )}
    >
      {kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Uploaded file preview"
          className="max-h-56 w-full bg-white object-contain"
        />
      )}

      {kind === "video" && (
        <video src={url} controls preload="metadata" className="max-h-56 w-full bg-black" />
      )}

      {(kind === "pdf" || kind === "file") && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-white px-4 py-3 text-sm text-zinc-700 transition-colors hover:text-primary"
        >
          <FileText className="size-4 shrink-0 text-zinc-400" />
          <span className="min-w-0 flex-1 truncate">{name}</span>
          <ExternalLink className="size-3.5 shrink-0" />
        </a>
      )}

      <div className="flex items-center justify-between border-t border-zinc-200/70 px-3 py-2">
        <span
          className={cn(
            "text-xs",
            justUploaded ? "font-medium text-green-700" : "text-zinc-500",
          )}
        >
          {justUploaded ? "Upload complete" : kind === "image" ? "Current image" : "Current file"}
        </span>
        <div className="flex items-center gap-3">
          {onReplace && (
            <button
              type="button"
              onClick={onReplace}
              className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-800"
            >
              <RefreshCw className="size-3" />
              Replace
            </button>
          )}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-red-600"
            >
              <Trash2 className="size-3" />
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
