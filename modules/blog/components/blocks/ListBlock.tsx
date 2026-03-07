"use client"

import { Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"

interface ListContent {
  items: string[]
}

interface ListBlockProps {
  value: ListContent
  onChange: (value: ListContent) => void
}

export function ListBlock({ value, onChange }: ListBlockProps) {
  const items = value.items ?? [""]

  function updateItem(index: number, text: string) {
    const next = [...items]
    next[index] = text
    onChange({ items: next })
  }

  function removeItem(index: number) {
    onChange({ items: items.filter((_, i) => i !== index) })
  }

  function addItem() {
    onChange({ items: [...items, ""] })
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
            placeholder={`Item ${i + 1}`}
          />
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="shrink-0 rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <Plus className="size-3.5" />
        Add item
      </button>
    </div>
  )
}
