"use client"

interface ParagraphContent {
  text: string
}

interface ParagraphBlockProps {
  value: ParagraphContent
  onChange: (value: ParagraphContent) => void
}

export function ParagraphBlock({ value, onChange }: ParagraphBlockProps) {
  return (
    <textarea
      value={value.text ?? ""}
      onChange={(e) => onChange({ text: e.target.value })}
      onInput={(e) => {
        const el = e.currentTarget
        el.style.height = "auto"
        el.style.height = `${el.scrollHeight}px`
      }}
      placeholder="Start writing..."
      rows={3}
      className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300 transition-colors"
    />
  )
}
