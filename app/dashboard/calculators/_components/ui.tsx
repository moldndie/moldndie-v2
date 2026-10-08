"use client"

// Small shared controls for the builder. Nothing clever — they exist so the
// cards read as content rather than as class-name soup.

import { Select as BaseSelect } from "@/components/ui/select"
import { Input as BaseInput } from "@/components/ui/input"
import { useState } from "react"
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-sm font-medium text-zinc-700">
      {children}{required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  )
}

export function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="mb-1 block text-xs font-medium text-zinc-600">
      {children}
      {hint && <span className="ml-1 font-normal normal-case text-zinc-400">{hint}</span>}
    </label>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <BaseInput {...props} className={cn("h-auto px-3 py-2 text-sm", props.className)} />
}

export function Select(props: React.ComponentProps<typeof BaseSelect>) {
  return <BaseSelect {...props} />
}

export function ReorderBtns({ idx, total, onMove }: { idx: number; total: number; onMove: (d: 1 | -1) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Button type="button" onClick={() => onMove(-1)} disabled={idx === 0} variant="outline" size="icon-xs">
        <ChevronUp className="size-3.5" />
      </Button>
      <Button type="button" onClick={() => onMove(1)} disabled={idx === total - 1} variant="outline" size="icon-xs">
        <ChevronDown className="size-3.5" />
      </Button>
    </div>
  )
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-800">{label}</p>
        <p className="text-xs text-zinc-500">{hint}</p>
      </div>
      <Switch size="md" checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

/**
 * Everything a normal author never touches lives in here. The default-closed
 * state is the point: a field card used to show twelve controls at once.
 */
export function Advanced({ children, count }: { children: React.ReactNode; count?: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/60">
      <Button variant="unstyled"
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 text-xs font-medium text-zinc-500 transition-colors hover:text-primary"
      >
        <Settings2 className="size-3.5" />
        Advanced
        {count ? <span className="rounded-full bg-zinc-200 px-1.5 text-[10px] text-zinc-600">{count}</span> : null}
        <span className="flex-1" />
        {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </Button>
      {open && <div className="space-y-4 border-t border-zinc-200 p-3">{children}</div>}
    </div>
  )
}

/** Inline problem, shown on the card that owns it rather than saved for step 4. */
export function Problem({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{children}</p>
  )
}
