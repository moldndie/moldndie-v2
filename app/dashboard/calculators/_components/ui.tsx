"use client"

// Small shared controls for the builder. Nothing clever — they exist so the
// cards read as content rather than as class-name soup.

import { useState } from "react"
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"

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
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
        props.className,
      )}
    />
  )
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
        props.className,
      )}
    >
      {children}
    </select>
  )
}

export function ReorderBtns({ idx, total, onMove }: { idx: number; total: number; onMove: (d: 1 | -1) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <button type="button" onClick={() => onMove(-1)} disabled={idx === 0} className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-20">
        <ChevronUp className="size-3.5" />
      </button>
      <button type="button" onClick={() => onMove(1)} disabled={idx === total - 1} className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-20">
        <ChevronDown className="size-3.5" />
      </button>
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
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-primary" : "bg-zinc-200")}
      >
        <span className={cn("absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
      </button>
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
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-800"
      >
        <Settings2 className="size-3.5" />
        Advanced
        {count ? <span className="rounded-full bg-zinc-200 px-1.5 text-[10px] text-zinc-600">{count}</span> : null}
        <span className="flex-1" />
        {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>
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
