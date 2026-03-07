"use client"

import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

interface HeadingContent {
  text: string
  level: 1 | 2 | 3
}

interface HeadingBlockProps {
  value: HeadingContent
  onChange: (value: HeadingContent) => void
}

export function HeadingBlock({ value, onChange }: HeadingBlockProps) {
  return (
    <div className="flex gap-2">
      <Select
        value={String(value.level ?? 2)}
        onChange={(e) => onChange({ ...value, level: Number(e.target.value) as 1 | 2 | 3 })}
        className="w-20 shrink-0"
      >
        <option value="1">H1</option>
        <option value="2">H2</option>
        <option value="3">H3</option>
      </Select>
      <Input
        value={value.text ?? ""}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
        placeholder="Heading text"
      />
    </div>
  )
}
