"use client"

import { Textarea } from "@/components/ui/textarea"

interface ParagraphContent {
  text: string
}

interface ParagraphBlockProps {
  value: ParagraphContent
  onChange: (value: ParagraphContent) => void
}

export function ParagraphBlock({ value, onChange }: ParagraphBlockProps) {
  return (
    <Textarea
      value={value.text ?? ""}
      onChange={(e) => onChange({ text: e.target.value })}
      placeholder="Paragraph text..."
      rows={4}
    />
  )
}
