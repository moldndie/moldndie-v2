"use client"

import { useState } from "react"
import { ICON_NAMES, DynamicIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface Props {
  value: string
  onChange: (name: string) => void
}

export default function IconPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
      >
        {value ? (
          <>
            <DynamicIcon name={value} size={18} strokeWidth={1.5} className="text-primary shrink-0" />
            <span className="flex-1 text-left">{value}</span>
          </>
        ) : (
          <span className="flex-1 text-left text-zinc-400">Choose icon…</span>
        )}
        <ChevronDown className={cn("size-4 text-zinc-400 transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-zinc-200 rounded-xl shadow-lg p-3 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-4 gap-1.5">
            {ICON_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => { onChange(name); setOpen(false) }}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium transition-colors",
                  value === name
                    ? "bg-primary text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <DynamicIcon
                  name={name}
                  size={20}
                  strokeWidth={1.5}
                  className={value === name ? "text-white" : "text-current"}
                />
                <span className="leading-none truncate w-full text-center">{name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
