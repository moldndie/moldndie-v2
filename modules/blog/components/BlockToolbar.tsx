"use client"

import { Plus } from "lucide-react"
import type { EditorBlock } from "../types"

const BLOCK_OPTIONS: { block_type: EditorBlock["block_type"]; label: string }[] = [
  { block_type: "heading", label: "Heading" },
  { block_type: "paragraph", label: "Paragraph" },
  { block_type: "image", label: "Image" },
  { block_type: "quote", label: "Quote" },
  { block_type: "list", label: "List" },
  { block_type: "video", label: "Video" },
]

interface BlockToolbarProps {
  onAdd: (block_type: EditorBlock["block_type"]) => void
}

export function BlockToolbar({ onAdd }: BlockToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {BLOCK_OPTIONS.map(({ block_type, label }) => (
        <button
          key={block_type}
          type="button"
          onClick={() => onAdd(block_type)}
          className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
        >
          <Plus className="size-3" />
          {label}
        </button>
      ))}
    </div>
  )
}
