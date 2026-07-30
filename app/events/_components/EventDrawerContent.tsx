"use client"

import Image from "next/image"
import { CalendarDays, MapPin, MapPinned, Tag, AlertCircle } from "lucide-react"
import { useEventById } from "@/hooks/queries/useEvents"
import RichTextRenderer from "@/components/editor/RichTextRenderer"

const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return "Date TBA"
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function isUpcoming(dateStr: string | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr) >= new Date()
}

function SkeletonDrawer() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-zinc-200" />
      <div className="p-5 space-y-4">
        <div className="h-3 w-16 bg-zinc-200 rounded" />
        <div className="h-6 w-3/4 bg-zinc-200 rounded" />
        <div className="h-3 w-1/2 bg-zinc-100 rounded" />
        <div className="h-3 w-1/3 bg-zinc-100 rounded" />
        <div className="border-t border-zinc-100 pt-4 space-y-2">
          <div className="h-3 w-full bg-zinc-100 rounded" />
          <div className="h-3 w-5/6 bg-zinc-100 rounded" />
          <div className="h-3 w-4/6 bg-zinc-100 rounded" />
        </div>
      </div>
    </div>
  )
}

function DetailRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-zinc-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm text-zinc-800">{children}</p>
      </div>
    </div>
  )
}

export function EventDrawerContent({ eventId }: { eventId: string }) {
  const { data: event, isLoading, isError } = useEventById(eventId)

  if (isLoading) return <SkeletonDrawer />

  if (isError || !event) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <AlertCircle size={40} className="text-red-300 mb-3" strokeWidth={1} />
        <p className="text-zinc-700 font-semibold">Failed to load event</p>
        <p className="text-zinc-400 text-sm mt-1">Please try again later.</p>
      </div>
    )
  }

  const imgSrc   = event.image_path ? `${R2_BASE}/${event.image_path}` : null
  const upcoming = isUpcoming(event.event_date)

  return (
    <div>
      {/* Hero — image on clean white background */}
      <div className="relative w-full h-48 bg-white border-b border-zinc-100 overflow-hidden shrink-0">
        {imgSrc ? (
          <Image src={imgSrc} alt={event.title} fill className="object-contain" sizes="460px" priority />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <CalendarDays size={48} className="text-zinc-200" strokeWidth={1} />
          </div>
        )}
        {/* Status badge */}
        {event.event_date && (
          <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase ${upcoming ? "bg-emerald-500 text-white" : "bg-zinc-600 text-white"}`}>
            {upcoming ? "Upcoming" : "Past Event"}
          </span>
        )}
      </div>

      {/* Title block below image */}
      <div className="px-5 pt-4 pb-0">
        {event.category && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
            <Tag size={9} />
            {event.category.name}
          </span>
        )}
        <h3 className="text-base font-extrabold text-zinc-900 leading-snug">{event.title}</h3>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {/* Date + location pills */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-zinc-700">
            <CalendarDays size={14} className="text-zinc-400 shrink-0" />
            <span className="font-medium">{formatEventDate(event.event_date)}</span>
          </div>
          {event.country && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <MapPin size={14} className="text-zinc-400 shrink-0" />
              {event.country}
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div className="pt-4 border-t border-zinc-100">
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-2">About this Event</p>
            <RichTextRenderer content={event.description} className="text-sm text-zinc-700" />
          </div>
        )}

        {/* Location detail */}
        {event.address && (
          <div className="pt-4 border-t border-zinc-100">
            <DetailRow icon={MapPinned} label="Venue">
              {event.address}{event.country ? `, ${event.country}` : ""}
            </DetailRow>
          </div>
        )}
      </div>
    </div>
  )
}
