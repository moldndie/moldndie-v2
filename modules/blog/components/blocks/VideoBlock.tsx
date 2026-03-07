"use client"

import { Input } from "@/components/ui/input"

interface VideoContent {
  url: string
}

interface VideoBlockProps {
  value: VideoContent
  onChange: (value: VideoContent) => void
}

export function VideoBlock({ value, onChange }: VideoBlockProps) {
  return (
    <Input
      value={value.url ?? ""}
      onChange={(e) => onChange({ url: e.target.value })}
      placeholder="YouTube or video URL..."
    />
  )
}
