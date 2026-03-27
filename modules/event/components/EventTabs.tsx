"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "Events", value: "events" },
  { label: "Categories", value: "categories" },
]

export function EventTabs() {
  const searchParams = useSearchParams()
  const active = searchParams.get("tab") ?? "events"

  return (
    <div className="flex gap-1 border-b border-zinc-200">
      {TABS.map((tab) => (
        <Link
          key={tab.value}
          href={`/dashboard/events?tab=${tab.value}`}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
            active === tab.value
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
