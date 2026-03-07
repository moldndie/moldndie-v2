"use client"

import { ChevronUp, ChevronDown, Trash2, GripVertical } from "lucide-react"
import type { EditorBlock } from "../types"
import { BlockToolbar } from "./BlockToolbar"
import { HeadingBlock } from "./blocks/HeadingBlock"
import { ParagraphBlock } from "./blocks/ParagraphBlock"
import { ImageBlock } from "./blocks/ImageBlock"
import { QuoteBlock } from "./blocks/QuoteBlock"
import { ListBlock } from "./blocks/ListBlock"
import { VideoBlock } from "./blocks/VideoBlock"

const BLOCK_LABELS: Record<EditorBlock["type"], string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  image: "Image",
  quote: "Quote",
  list: "List",
  video: "Video",
}

function getDefaultContent(type: EditorBlock["type"]): Record<string, unknown> {
  switch (type) {
    case "heading": return { text: "", level: 2 }
    case "paragraph": return { text: "" }
    case "image": return { url: "", caption: "" }
    case "quote": return { text: "", author: "" }
    case "list": return { items: [""] }
    case "video": return { url: "" }
  }
}

interface BlockEditorProps {
  value: EditorBlock[]
  onChange: (blocks: EditorBlock[]) => void
}

export function BlockEditor({ value, onChange }: BlockEditorProps) {
  function addBlock(type: EditorBlock["type"]) {
    onChange([
      ...value,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type,
        content: getDefaultContent(type),
      },
    ])
  }

  function updateBlock(id: string, content: Record<string, unknown>) {
    onChange(value.map((b) => (b.id === id ? { ...b, content } : b)))
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
    switch (block.type) {
      case "heading":
        return <HeadingBlock value={block.content as { text: string; level: 1 | 2 | 3 }} onChange={handleChange} />
      case "paragraph":
        return <ParagraphBlock value={block.content as { text: string }} onChange={handleChange} />
      case "image":
        return <ImageBlock value={block.content as { url: string; caption?: string }} onChange={handleChange} />
      case "quote":
        return <QuoteBlock value={block.content as { text: string; author?: string }} onChange={handleChange} />
      case "list":
        return <ListBlock value={block.content as { items: string[] }} onChange={handleChange} />
      case "video":
        return <VideoBlock value={block.content as { url: string }} onChange={handleChange} />
    }
  }

  return (
    <div className="space-y-4">
      {value.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
          Add content blocks below
        </div>
      ) : (
        <div className="space-y-2">
          {value.map((block, i) => (
            <div
              key={block.id}
              className="flex gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"
            >
              <div className="flex shrink-0 flex-col items-center gap-0.5 pt-0.5">
                <GripVertical className="size-4 text-zinc-300 mb-1" />
                <button
                  type="button"
                  onClick={() => moveBlock(block.id, "up")}
                  disabled={i === 0}
                  className="rounded p-0.5 text-zinc-300 hover:text-zinc-600 disabled:opacity-30 transition-colors"
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(block.id, "down")}
                  disabled={i === value.length - 1}
                  className="rounded p-0.5 text-zinc-300 hover:text-zinc-600 disabled:opacity-30 transition-colors"
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {BLOCK_LABELS[block.type]}
                </span>
                {renderInput(block)}
              </div>

              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                className="shrink-0 self-start rounded p-1 text-zinc-300 hover:bg-zinc-50 hover:text-red-500 transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <BlockToolbar onAdd={addBlock} />
    </div>
  )
}
