"use client"

import { Type, AlignLeft, ImageIcon, Quote, List, Play, Paperclip } from "lucide-react"
import type { EditorBlock } from "../types"

const BLOCK_OPTIONS: { block_type: EditorBlock["block_type"]; label: string; icon: React.ElementType }[] = [
  { block_type: "heading",   label: "Heading",   icon: Type },
  { block_type: "paragraph", label: "Paragraph", icon: AlignLeft },
  { block_type: "image",     label: "Image",     icon: ImageIcon },
  { block_type: "quote",     label: "Quote",     icon: Quote },
  { block_type: "list",      label: "List",      icon: List },
  { block_type: "video",     label: "Video",     icon: Play },
  { block_type: "file",      label: "File",      icon: Paperclip },
]

interface BlockToolbarProps {
  onAdd: (block_type: EditorBlock["block_type"]) => void
}

export function BlockToolbar({ onAdd }: BlockToolbarProps) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-3">
      <p className="mb-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">Add block</p>
      <div className="flex flex-wrap gap-1.5">
        {BLOCK_OPTIONS.map(({ block_type, label, icon: Icon }) => (
          <button
            key={block_type}
            type="button"
            onClick={() => onAdd(block_type)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
          >
            <Icon className="size-3.5 shrink-0" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
