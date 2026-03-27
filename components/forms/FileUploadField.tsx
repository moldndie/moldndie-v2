"use client"

import { useRef } from "react"
import { Upload, X, RotateCcw, CheckCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFileUpload } from "@/hooks/useFileUpload"

interface FileUploadFieldProps {
  folder: string
  accept?: string
  label?: string
  /** Key already stored (e.g. from an existing record in edit mode) */
  existingValue?: string | null
  /** Called with { key, url } once a new upload succeeds */
  onUploadSuccess: (result: { key: string; url: string }) => void
  /** Fires whenever upload active state changes — use to gate form submission */
  onUploadingChange?: (uploading: boolean) => void
  className?: string
}

export function FileUploadField({
  folder,
  accept,
  label = "Click to select file",
  existingValue,
  onUploadSuccess,
  onUploadingChange,
  className,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { progress, isUploading, error, result, upload, cancelUpload, retry, reset } =
    useFileUpload({ folder })

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (inputRef.current) inputRef.current.value = ""

    onUploadingChange?.(true)
    const uploadResult = await upload(file)
    onUploadingChange?.(false)
    if (uploadResult) onUploadSuccess(uploadResult)
  }

  // ── Success (new upload just completed) ───────────────────────────────────
  if (result) {
    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3",
          className,
        )}
      >
        <span className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="size-4 shrink-0" />
          Upload complete
        </span>
        <button
          type="button"
          onClick={reset}
          className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          Replace
        </button>
      </div>
    )
  }

  // ── Uploading ─────────────────────────────────────────────────────────────
  if (isUploading) {
    return (
      <div className={cn("space-y-3 rounded-lg border border-zinc-200 p-4", className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-zinc-600">
            <Loader2 className="size-4 animate-spin" />
            Uploading…
          </span>
          <span className="font-medium text-zinc-800">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          type="button"
          onClick={cancelUpload}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-600 transition-colors"
        >
          <X className="size-3" />
          Cancel
        </button>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className={cn("space-y-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3", className)}
      >
        <p className="text-sm text-red-700">{error}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={retry}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
          >
            <RotateCcw className="size-3" />
            Retry
          </button>
          <button
            type="button"
            onClick={reset}
            className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            Choose different file
          </button>
        </div>
      </div>
    )
  }

  // ── Idle: existing value in edit mode ─────────────────────────────────────
  if (existingValue) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-zinc-600">
            <CheckCircle className="size-4 shrink-0 text-zinc-400" />
            File already uploaded
          </span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            Replace
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    )
  }

  // ── Idle: empty ───────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700"
      >
        <Upload className="size-4" />
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
