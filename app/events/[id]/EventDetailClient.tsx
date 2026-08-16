"use client"

import Image from "next/image"
import Link from "next/link"
import {
  CalendarDays,
  MapPin,
  MapPinned,
  AlertCircle,
  Tag,
  Eye,
  Phone,
  Mail,
} from "lucide-react"
import { useEventById } from "@/hooks/queries/useEvents"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
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

// ── Skeleton ──────────────────────────────────────────────────
function SkeletonDetail() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 animate-pulse">
      <div className="h-4 w-28 bg-zinc-200 rounded mb-8" />
      <div className="aspect-video bg-zinc-200 rounded-2xl mb-8" />
      <div className="space-y-4">
        <div className="h-3 w-20 bg-zinc-200 rounded" />
        <div className="h-9 w-2/3 bg-zinc-200 rounded" />
        <div className="flex gap-4">
          <div className="h-3 w-28 bg-zinc-100 rounded" />
          <div className="h-3 w-20 bg-zinc-100 rounded" />
        </div>
        <div className="space-y-2 pt-4">
          <div className="h-3 bg-zinc-100 rounded w-full" />
          <div className="h-3 bg-zinc-100 rounded w-5/6" />
          <div className="h-3 bg-zinc-100 rounded w-4/6" />
        </div>
      </div>
    </div>
  )
}

// ── Error ─────────────────────────────────────────────────────
function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-6">
      <AlertCircle size={48} className="text-red-300 mb-4" strokeWidth={1} />
      <p className="text-zinc-700 font-semibold text-lg">Something went wrong</p>
      <p className="text-zinc-400 text-sm mt-1">
        We couldn't load this event. Please try again.
      </p>
      <Link
        href="/events"
        className="mt-6 text-sm text-primary no-underline underline-offset-2 hover:underline hover:opacity-70 transition-opacity"
      >
        Back to Events
      </Link>
    </div>
  )
}

// ── Not found ─────────────────────────────────────────────────
function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-6">
      <CalendarDays size={48} className="text-zinc-200 mb-4" strokeWidth={1} />
      <p className="text-zinc-700 font-semibold text-lg">Event not found</p>
      <p className="text-zinc-400 text-sm mt-1">
        This event may have been removed or doesn't exist.
      </p>
      <Link
        href="/events"
        className="mt-6 text-sm text-primary no-underline underline-offset-2 hover:underline hover:opacity-70 transition-opacity"
      >
        Back to Events
      </Link>
    </div>
  )
}

// ── Detail row ────────────────────────────────────────────────
function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-zinc-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-sm text-zinc-800">{children}</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function EventDetailClient({ eventId, viewCount }: { eventId: string; viewCount?: number }) {
  const { data: event, isLoading, isError } = useEventById(eventId)

  if (isLoading) return <SkeletonDetail />
  if (isError) return <ErrorState />
  if (!event) return <NotFoundState />

  const imgSrc   = event.image_path ? `${R2_BASE}/${event.image_path}` : null
  const upcoming = isUpcoming(event.event_date)

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* ── Breadcrumb ── */}
      <div className="mb-8">
        <PublicBreadcrumb crumbs={[{ label: "Events", href: "/events" }, { label: event.title }]} />
      </div>

      {/* ── Hero image ── */}
      {imgSrc && (
        <div className="aspect-video relative rounded-2xl overflow-hidden bg-white border border-zinc-100 mb-8">
          <Image
            src={imgSrc}
            alt={event.title}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
          {event.event_date && (
            <span
              className={`absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase ${
                upcoming ? "bg-emerald-500 text-white" : "bg-zinc-700 text-white"
              }`}
            >
              {upcoming ? "Upcoming" : "Past Event"}
            </span>
          )}
        </div>
      )}

      {/* ── Content card ── */}
      <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-zinc-100 space-y-3">
          {event.category && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary uppercase tracking-widest">
              <Tag size={11} />
              {event.category.name}
            </span>
          )}

          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 leading-tight">
            {event.title}
          </h1>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-sm text-zinc-600">
              <CalendarDays size={15} className="text-zinc-400 shrink-0" />
              <span className="font-medium">{formatEventDate(event.event_date)}</span>
            </div>
            {event.country && (
              <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                <MapPin size={15} className="text-zinc-400 shrink-0" />
                {event.country}
              </div>
            )}
            {viewCount != null && viewCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-zinc-400 ml-auto">
                <Eye size={12} className="shrink-0" />
                {viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount.toLocaleString()} views
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {/* Description */}
          {event.description && (
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3">
                About this Event
              </p>
              <RichTextRenderer content={event.description} className="text-sm text-zinc-700" />
            </div>
          )}

          {/* Location + contact details */}
          {(event.address || event.phone || event.email) && (
            <div className="space-y-4 pt-2 border-t border-zinc-50">
              {event.address && (
                <DetailRow icon={MapPinned} label="Location">
                  {event.address}
                  {event.country ? `, ${event.country}` : ""}
                </DetailRow>
              )}
              {event.phone && (
                <DetailRow icon={Phone} label="Phone">
                  <a href={`tel:${event.phone}`} className="text-primary hover:underline">
                    {event.phone}
                  </a>
                </DetailRow>
              )}
              {event.email && (
                <DetailRow icon={Mail} label="Email">
                  <a href={`mailto:${event.email}`} className="text-primary hover:underline break-all">
                    {event.email}
                  </a>
                </DetailRow>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
