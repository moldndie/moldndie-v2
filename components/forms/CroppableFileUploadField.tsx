"use client"

import { useRef, useState } from "react"
import { Upload, X, RotateCcw, CheckCircle, Loader2, Crop } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFileUpload } from "@/hooks/useFileUpload"
import { ImageCropModal } from "@/components/ui/ImageCropModal"

interface CroppableFileUploadFieldProps {
  folder: string
  /** Aspect ratio for the cropper, e.g. 16/9, 4/3, 1 */
  aspect?: number
  label?: string
  existingValue?: string | null
  onUploadSuccess: (result: { key: string; url: string }) => void
  onUploadingChange?: (uploading: boolean) => void
  className?: string
}

export function CroppableFileUploadField({
  folder,
  aspect = 16 / 9,
  label = "Click to select image",
  existingValue,
  onUploadSuccess,
  onUploadingChange,
  className,
}: CroppableFileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { progress, isUploading, error, result, upload, cancelUpload, retry, reset } =
    useFileUpload({ folder })

  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [pendingFileName, setPendingFileName] = useState<string>("image")

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (inputRef.current) inputRef.current.value = ""
    if (!file.type.startsWith("image/")) return

    setPendingFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setCropSrc(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleCropDone(croppedFile: File) {
    setCropSrc(null)
    onUploadingChange?.(true)
    const uploadResult = await upload(croppedFile)
    onUploadingChange?.(false)
    if (uploadResult) onUploadSuccess(uploadResult)
  }

  function handleCropCancel() {
    setCropSrc(null)
  }

  // ── Success ───────────────────────────────────────────────────
  if (result) {
    return (
      <div className={cn("flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3", className)}>
        <span className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="size-4 shrink-0" />
          Upload complete
        </span>
        <button type="button" onClick={reset} className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors">
          Replace
        </button>
      </div>
    )
  }

  // ── Uploading ─────────────────────────────────────────────────
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
          <div className="h-full rounded-full bg-primary transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
        <button type="button" onClick={cancelUpload} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-600 transition-colors">
          <X className="size-3" />
          Cancel
        </button>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={cn("space-y-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3", className)}>
        <p className="text-sm text-red-700">{error}</p>
        <div className="flex gap-3">
          <button type="button" onClick={retry} className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 transition-colors">
            <RotateCcw className="size-3" />
            Retry
          </button>
          <button type="button" onClick={reset} className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors">
            Choose different file
          </button>
        </div>
      </div>
    )
  }

  // ── Existing value ────────────────────────────────────────────
  if (existingValue && !result) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-zinc-600">
            <CheckCircle className="size-4 shrink-0 text-zinc-400" />
            Image already uploaded
          </span>
          <button type="button" onClick={() => inputRef.current?.click()} className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors">
            Replace
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        {cropSrc && (
          <ImageCropModal
            imageSrc={cropSrc}
            aspect={aspect}
            originalFileName={pendingFileName}
            onCancel={handleCropCancel}
            onCropDone={handleCropDone}
          />
        )}
      </div>
    )
  }

  // ── Idle ──────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700"
      >
        <div className="flex items-center gap-1.5">
          <Upload className="size-4" />
          <Crop className="size-3.5" />
        </div>
        {label}
        <span className="text-[10px] text-zinc-400">Image will be cropped before upload</span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={aspect}
          originalFileName={pendingFileName}
          onCancel={handleCropCancel}
          onCropDone={handleCropDone}
        />
      )}
    </div>
  )
}
