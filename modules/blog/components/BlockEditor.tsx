"use client"

import { ChevronUp, ChevronDown, Trash2, Type, AlignLeft, ImageIcon, Quote, List, Play, Columns2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EditorBlock } from "../types"
import { BlockToolbar } from "./BlockToolbar"
import { HeadingBlock } from "./blocks/HeadingBlock"
import { ParagraphBlock } from "./blocks/ParagraphBlock"
import { ImageBlock } from "./blocks/ImageBlock"
import { QuoteBlock } from "./blocks/QuoteBlock"
import { ListBlock } from "./blocks/ListBlock"
import { VideoBlock } from "./blocks/VideoBlock"

const BLOCK_META: Record<EditorBlock["block_type"], { label: string; icon: React.ElementType; accent: string; badge: string }> = {
  heading:   { label: "Heading",   icon: Type,       accent: "border-l-blue-400",   badge: "bg-blue-50 text-blue-700" },
  paragraph: { label: "Paragraph", icon: AlignLeft,  accent: "border-l-zinc-300",   badge: "bg-zinc-100 text-zinc-600" },
  image:     { label: "Image",     icon: ImageIcon,  accent: "border-l-emerald-400", badge: "bg-emerald-50 text-emerald-700" },
  quote:     { label: "Quote",     icon: Quote,      accent: "border-l-amber-400",   badge: "bg-amber-50 text-amber-700" },
  list:      { label: "List",      icon: List,       accent: "border-l-violet-400",  badge: "bg-violet-50 text-violet-700" },
  video:     { label: "Video",     icon: Play,       accent: "border-l-rose-400",    badge: "bg-rose-50 text-rose-700" },
}

function getDefaultContent(block_type: EditorBlock["block_type"]): Record<string, unknown> {
  switch (block_type) {
    case "heading":   return { text: "", level: 2 }
    case "paragraph": return { text: "" }
    case "image":     return { url: "", caption: "" }
    case "quote":     return { text: "", author: "" }
    case "list":      return { items: [""] }
    case "video":     return { url: "" }
  }
}

interface BlockEditorProps {
  value: EditorBlock[]
  onChange: (blocks: EditorBlock[]) => void
}

export function BlockEditor({ value, onChange }: BlockEditorProps) {
  function addBlock(block_type: EditorBlock["block_type"]) {
    onChange([
      ...value,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        block_type,
        content: getDefaultContent(block_type),
      },
    ])
  }

  function updateBlock(id: string, content: Record<string, unknown>) {
    onChange(value.map((b) => (b.id === id ? { ...b, content } : b)))
  }

  function patchBlock(id: string, patch: Partial<EditorBlock>) {
    onChange(value.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }

  function removeBlock(id: string) {
    onChange(value.filter((b) => b.id !== id))
  }

  function moveBlock(id: string, direction: "up" | "down") {
    const index = value.findIndex((b) => b.id === id)
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === value.length - 1) return
    const next = [...value]
    const swap = direction === "up" ? index - 1 : index + 1
    ;[next[index], next[swap]] = [next[swap], next[index]]
    onChange(next)
  }

  function renderInput(block: EditorBlock) {
    const handleChange = (content: Record<string, unknown>) => updateBlock(block.id, content)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = (v: any) => handleChange(v as Record<string, unknown>)
    switch (block.block_type) {
      case "heading":
        return <HeadingBlock value={block.content as { text: string; level: 1 | 2 | 3 }} onChange={h} />
      case "paragraph":
        return <ParagraphBlock value={block.content as { text: string }} onChange={h} />
      case "image":
        return <ImageBlock value={block.content as { url: string; caption?: string }} onChange={h} />
      case "quote":
        return <QuoteBlock value={block.content as { text: string; author?: string }} onChange={h} />
      case "list":
        return <ListBlock value={block.content as { items: string[] }} onChange={h} />
      case "video":
        return <VideoBlock value={block.content as { url: string }} onChange={h} />
    }
  }

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-zinc-200 py-12 text-center">
          <p className="text-sm text-zinc-400">No content blocks yet</p>
          <p className="mt-1 text-xs text-zinc-300">Use the buttons below to add blocks</p>
        </div>
      ) : (
        <div className="space-y-2">
          {value.map((block, i) => {
            const meta = BLOCK_META[block.block_type]
            const Icon = meta.icon
            const isTwoCol = block.layout === "two-column"

            return (
              <div
                key={block.id}
                className={cn(
                  "rounded-xl border border-zinc-200 border-l-4 bg-white shadow-sm overflow-hidden",
                  meta.accent
                )}
              >
                {/* Block header */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100 bg-zinc-50/60">
                  {/* Type badge */}
                  <span className={cn("flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold", meta.badge)}>
                    <Icon className="size-3" />
                    {meta.label}
                  </span>

                  {/* Layout controls */}
                  <div className="flex items-center gap-1 ml-2">
                    <Columns2 className="size-3 text-zinc-400 shrink-0" />
                    <button
                      type="button"
                      onClick={() => patchBlock(block.id, { layout: null, column_position: null })}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                        !isTwoCol
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                      )}
                    >
                      Full
                    </button>
                    <button
                      type="button"
                      onClick={() => patchBlock(block.id, { layout: "two-column", column_position: block.column_position ?? "left" })}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                        isTwoCol
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                      )}
                    >
                      ½
                    </button>
                    {isTwoCol && (
                      <>
                        <span className="text-zinc-200 select-none">·</span>
                        <button
                          type="button"
                          onClick={() => patchBlock(block.id, { column_position: "left" })}
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                            block.column_position === "left"
                              ? "bg-zinc-800 text-white"
                              : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                          )}
                        >
                          Left
                        </button>
                        <button
                          type="button"
                          onClick={() => patchBlock(block.id, { column_position: "right" })}
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                            block.column_position === "right"
                              ? "bg-zinc-800 text-white"
                              : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                          )}
                        >
                          Right
                        </button>
                      </>
                    )}
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Move + delete */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveBlock(block.id, "up")}
                      disabled={i === 0}
                      className="rounded p-1 text-zinc-300 hover:text-zinc-600 disabled:opacity-20 transition-colors"
                      title="Move up"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(block.id, "down")}
                      disabled={i === value.length - 1}
                      className="rounded p-1 text-zinc-300 hover:text-zinc-600 disabled:opacity-20 transition-colors"
                      title="Move down"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="rounded p-1 text-zinc-300 hover:text-red-500 transition-colors ml-0.5"
                      title="Remove block"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Block content */}
                <div className="p-3">
                  {renderInput(block)}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <BlockToolbar onAdd={addBlock} />
    </div>
  )
}
