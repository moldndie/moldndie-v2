"use client"

import { useRef, useState } from "react"
import { Upload, X } from "lucide-react"
import { uploadFileToR2 } from "@/services/upload.service"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  bucket: string
  value?: string
  onChange: (url: string) => void
  onClear?: () => void
  className?: string
}

export function ImageUpload({ bucket, value, onChange, onClear, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }
    setError(null)
    setUploading(true)
    try {
      const result = await uploadFileToR2(bucket, file)
      onChange(result.url)
    } catch {
      setError("Upload failed. Please try again.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="h-32 w-auto rounded-lg border border-zinc-200 object-cover"
          />
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-700"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 disabled:opacity-50"
        >
          <Upload className="size-4" />
          {uploading ? "Uploading…" : "Click to upload"}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
