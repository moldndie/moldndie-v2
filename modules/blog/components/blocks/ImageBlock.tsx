"use client"

import { Input } from "@/components/ui/input"
import { ImageUpload } from "@/components/ui/image-upload"

interface ImageContent {
  url: string
  caption?: string
}

interface ImageBlockProps {
  value: ImageContent
  onChange: (value: ImageContent) => void
}

export function ImageBlock({ value, onChange }: ImageBlockProps) {
  return (
    <div className="space-y-2">
      <ImageUpload
        bucket="blog-images"
        value={value.url || undefined}
        onChange={(url) => onChange({ ...value, url })}
        onClear={() => onChange({ ...value, url: "" })}
      />
      <Input
        value={value.caption ?? ""}
        onChange={(e) => onChange({ ...value, caption: e.target.value })}
        placeholder="Caption (optional)"
      />
    </div>
  )
}
