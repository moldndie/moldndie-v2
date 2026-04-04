"use client"

import { Input } from "@/components/ui/input"

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
      <textarea
        value={value.text ?? ""}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
        onInput={(e) => {
          const el = e.currentTarget
          el.style.height = "auto"
          el.style.height = `${el.scrollHeight}px`
        }}
        placeholder="Quote text..."
        rows={3}
        className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm italic text-zinc-700 placeholder:text-zinc-400 placeholder:not-italic focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300 transition-colors"
      />
      <Input
        value={value.author ?? ""}
        onChange={(e) => onChange({ ...value, author: e.target.value })}
        placeholder="— Author (optional)"
      />
    </div>
  )
}
