"use client"

interface ResultCardProps {
  label: string
  value: string
  note?: string
}

export function ResultCard({ label, value, note }: ResultCardProps) {
  return (
    <div className="rounded-xl bg-primary/5 border border-primary/20 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary/70 mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-zinc-900 tabular-nums">{value}</p>
      {note && <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">{note}</p>}
    </div>
  )
}
