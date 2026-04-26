"use client"

import { useRef, useState } from "react"
import {
  Upload,
  X,
  FileText,
  FileSpreadsheet,
  Presentation,
  Video,
  Archive,
  File,
} from "lucide-react"

export interface FileContent {
  file_path: string
  file_name: string
  file_size?: number
  file_type: string
}

interface FileBlockProps {
  value: FileContent
  onChange: (value: FileContent) => void
}

const ACCEPTED =
  ".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.mp4,.zip,.rar"

const MAX_SIZE_MB = 100

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(mime: string) {
  if (mime.startsWith("video/")) return Video
  if (mime.includes("pdf")) return FileText
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("xlsx") || mime.includes("xls")) return FileSpreadsheet
  if (mime.includes("presentation") || mime.includes("powerpoint") || mime.includes("pptx") || mime.includes("ppt")) return Presentation
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("x-zip") || mime.includes("x-rar")) return Archive
  return File
}

export function FileBlock({ value, onChange }: FileBlockProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File exceeds ${MAX_SIZE_MB} MB limit.`)
      return
    }

    setError(null)
    setUploading(true)
    setProgress("Preparing upload…")

    try {
      const res = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          folder: "blog-attachments",
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to get upload URL")
      }

      const { uploadUrl, key } = await res.json()

      setProgress("Uploading…")
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      })

      if (!uploadRes.ok) throw new Error("Upload failed")

      onChange({
        file_path: key,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || "application/octet-stream",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  if (value.file_path) {
    const Icon = fileIcon(value.file_type)
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Icon className="size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate">{value.file_name}</p>
            {value.file_size && (
              <p className="text-xs text-zinc-400">{formatBytes(value.file_size)}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange({ file_path: "", file_name: "", file_type: "" })}
          className="shrink-0 rounded-md p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 px-4 py-6 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 disabled:opacity-50"
      >
        <Upload className="size-5" />
        <span>{uploading ? progress ?? "Uploading…" : "Click to upload file"}</span>
        <span className="text-xs text-zinc-400">PDF, PPT, DOC, XLS, JPG, PNG, MP4, ZIP, RAR — max {MAX_SIZE_MB} MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={handleFile}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
