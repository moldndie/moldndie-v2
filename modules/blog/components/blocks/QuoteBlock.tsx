"use client"

import { Input } from "@/components/ui/input"
import RichTextEditor from "@/components/editor/RichTextEditor"
import { toDoc, fromDoc } from "@/lib/richtext"

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
      {/* Same stringified-Tiptap convention as ParagraphBlock; author stays plain. */}
      <RichTextEditor
        value={toDoc(value.text)}
        onChange={(doc) => onChange({ ...value, text: fromDoc(doc) })}
        placeholder="Quote text…"
        minHeight={120}
      />
      <Input
        value={value.author ?? ""}
        onChange={(e) => onChange({ ...value, author: e.target.value })}
        placeholder="— Author (optional)"
      />
    </div>
  )
}
