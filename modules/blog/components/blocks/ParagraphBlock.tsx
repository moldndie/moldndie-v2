"use client"

import RichTextEditor from "@/components/editor/RichTextEditor"
import { toDoc, fromDoc } from "@/lib/richtext"

interface ParagraphContent {
  text: string
}

interface ParagraphBlockProps {
  value: ParagraphContent
  onChange: (value: ParagraphContent) => void
}

/**
 * `text` holds a stringified Tiptap doc, the same convention as every other
 * rich-text column. Posts written before this block became rich text hold raw
 * plain text — `toDoc` wraps those in a paragraph rather than dropping them.
 */
export function ParagraphBlock({ value, onChange }: ParagraphBlockProps) {
  return (
    <RichTextEditor
      value={toDoc(value.text)}
      onChange={(doc) => onChange({ text: fromDoc(doc) })}
      placeholder="Start writing…"
      minHeight={140}
    />
  )
}
