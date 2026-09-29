"use client"

import { Button } from "@/components/ui/button"
import { useRef } from "react"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadFieldProps {
  /** Accepts a File (new selection) or a string URL (existing image) */
  value?: File | string | null
  onChange: (file: File | null) => void
  className?: string
}

export function ImageUploadField({ value, onChange, className }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const previewUrl =
    value instanceof File
      ? URL.createObjectURL(value)
      : typeof value === "string" && value
      ? value
      : undefined

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return
    onChange(file)
    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className={cn("space-y-2", className)}>
      {previewUrl ? (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Preview"
            className="h-32 w-auto rounded-lg border border-zinc-200 object-cover"
          />
          <Button
            type="button"
            size="icon-xs"
            aria-label="Remove image"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 size-5 rounded-full"
          >
            <X className="size-3" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 text-sm text-zinc-500 transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Upload className="size-4" />
          Click to select image
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
