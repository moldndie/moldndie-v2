"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface QuoteContent {
  text: string
  author?: string
}

interface QuoteBlockProps {
  value: QuoteContent
  onChange: (value: QuoteContent) => void
}

export function QuoteBlock({ value, onChange }: QuoteBlockProps) {
  return (
    <div className="space-y-2">
      <Textarea
        value={value.text ?? ""}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
        placeholder="Quote text..."
        rows={3}
      />
      <Input
        value={value.author ?? ""}
        onChange={(e) => onChange({ ...value, author: e.target.value })}
        placeholder="Author (optional)"
      />
    </div>
  )
}
