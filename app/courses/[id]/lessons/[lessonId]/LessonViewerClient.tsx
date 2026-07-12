"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import { useEffect, useRef, useState } from "react"
import {
  Lock,
  Play,
  ChevronLeft,
  ChevronRight,
  FileText,
  File,
  BookOpen,
  ArrowLeft,
  AlertCircle,
  ShoppingCart,
  Download,
  Archive,
  CheckCircle2,
  GraduationCap,
} from "lucide-react"
import { useCourseById, useCourseAccess } from "@/hooks/queries/useCourses"
import { useAddToCart, useCartHasItem } from "@/hooks/queries/useCart"
import { cn } from "@/lib/utils"
import type { CourseLesson } from "@/types"

const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

// ── YouTube embed ──────────────────────────────────────────────
function getYouTubeEmbedUrl(url: string): string | null {
  const short = url.match(/youtu\.be\/([^?&]+)/)
  if (short) return `https://www.youtube.com/embed/${short[1]}?rel=0&modestbranding=1`
  const long = url.match(/[?&]v=([^&]+)/)
  if (long) return `https://www.youtube.com/embed/${long[1]}?rel=0&modestbranding=1`
  return null
}

// ── Video player ───────────────────────────────────────────────
function VideoPlayer({ url, onEnded }: { url: string; onEnded?: () => void }) {
  const embedUrl = getYouTubeEmbedUrl(url)
  if (embedUrl) {
    return (
      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-zinc-950 shadow-lg">
        <iframe
          src={embedUrl}
          title="Lesson video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    )
  }
  return (
    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-zinc-950 shadow-lg">
      <video src={url} controls className="w-full h-full" playsInline onEnded={onEnded} />
    </div>
  )
}

// ── Next-lesson card ───────────────────────────────────────────
function NextLessonCard({
  lesson,
  courseId,
  onDismiss,
}: {
  lesson: CourseLesson
  courseId: string
  onDismiss: () => void
}) {
  return (
    <div className="aspect-video w-full rounded-2xl bg-zinc-900 flex flex-col items-center justify-center gap-5 text-center px-8 relative shadow-lg">
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors text-lg leading-none"
      >
        ✕
      </button>
      <p className="text-zinc-400 text-xs uppercase tracking-widest font-semibold">Up Next</p>
      <p className="text-white text-xl font-bold max-w-xs leading-tight">{lesson.title}</p>
      <Link
        href={`/courses/${courseId}/lessons/${lesson.id}`}
        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold text-sm px-7 py-3 rounded-xl transition-colors shadow"
      >
        <Play size={14} fill="currentColor" />
        Play Next
      </Link>
    </div>
  )
}

// ── PDF primary card (Case 2: pdf with no video) ───────────────
function PdfPrimaryCard({ pdfUrl }: { pdfUrl: string }) {
  return (
    <div className="w-full rounded-2xl bg-linear-to-br from-rose-50 to-red-50/60 border border-red-100 p-8 sm:p-12 flex flex-col items-center gap-6 text-center shadow-sm">
      <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-red-100">
        <FileText size={40} className="text-red-500" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-xl font-bold text-zinc-900">PDF Lesson</p>
        <p className="text-sm text-zinc-500 mt-1.5">This lesson is delivered as a PDF document</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors shadow-sm"
        >
          <BookOpen size={16} />
          Open PDF
        </a>
        <a
          href={pdfUrl}
          download
          className="flex items-center gap-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
        >
          <Download size={16} />
          Download
        </a>
      </div>
    </div>
  )
}

// ── File type icon helper ──────────────────────────────────────
function FileIcon({ filename }: { filename: string }) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  if (ext === "pdf") return <FileText size={20} className="text-red-500" />
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext))
    return <Archive size={20} className="text-yellow-500" />
  if (["doc", "docx"].includes(ext)) return <FileText size={20} className="text-blue-500" />
  if (["xls", "xlsx", "csv"].includes(ext)) return <FileText size={20} className="text-emerald-500" />
  if (["ppt", "pptx"].includes(ext)) return <FileText size={20} className="text-orange-500" />
  return <File size={20} className="text-zinc-400" />
}

function basename(path: string) {
  return path.split("/").pop() ?? path
}

// ── File download card ─────────────────────────────────────────
function FileCard({ url, label }: { url: string; label: string }) {
  const name = basename(url)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm transition-all group"
    >
      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-zinc-200 transition-colors">
        <FileIcon filename={name} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-800 truncate">{label}</p>
        <p className="text-xs text-zinc-400 truncate mt-0.5">{name}</p>
      </div>
      <Download size={16} className="text-zinc-400 shrink-0 group-hover:text-zinc-600 transition-colors" />
    </a>
  )
}

// ── Files-only primary section (Case 3) ───────────────────────
function FilesPrimarySection({ fileUrl }: { fileUrl: string }) {
  return (
    <div className="w-full rounded-2xl bg-linear-to-br from-zinc-50 to-zinc-100/60 border border-zinc-200 p-8 sm:p-12 flex flex-col items-center gap-6 text-center shadow-sm">
      <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-zinc-200">
        <Archive size={40} className="text-zinc-500" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-xl font-bold text-zinc-900">Downloadable Resource</p>
        <p className="text-sm text-zinc-500 mt-1.5">This lesson includes a downloadable file</p>
      </div>
      <div className="w-full max-w-sm">
        <FileCard url={fileUrl} label="Download Lesson File" />
      </div>
    </div>
  )
}

// ── Locked lesson ──────────────────────────────────────────────
function LockedLesson({
  courseId,
  price,
  onAddToCart,
  inCart,
}: {
  courseId: string
  price: number | null
  onAddToCart: () => void
  inCart: boolean
}) {
  return (
    <div className="aspect-video w-full rounded-2xl bg-zinc-50 border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-5 text-center px-8">
      <div className="w-16 h-16 rounded-full bg-zinc-200/80 flex items-center justify-center">
        <Lock size={28} className="text-zinc-400" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-lg font-bold text-zinc-800">Lesson Locked</p>
        <p className="text-sm text-zinc-400 mt-1">Purchase the course to unlock all lessons.</p>
      </div>
      {inCart ? (
        <Link
          href="/cart"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          View in Cart
        </Link>
      ) : (
        <button
          onClick={onAddToCart}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <ShoppingCart size={15} />
          {price ? `Buy Course — ${price} EGP` : "Buy Course"}
        </button>
      )}
      <Link
        href={`/courses/${courseId}`}
        className="text-sm text-zinc-400 hover:text-zinc-600 underline underline-offset-2 transition-colors"
      >
        Back to course
      </Link>
    </div>
  )
}

// ── Sidebar lesson row ─────────────────────────────────────────
function SidebarLesson({
  lesson,
  index,
  courseId,
  isCurrent,
  accessible,
  activeRef,
}: {
  lesson: CourseLesson
  index: number
  courseId: string
  isCurrent: boolean
  accessible: boolean
  activeRef?: (el: HTMLElement | null) => void
}) {
  const isVideo = !!(lesson.video_url || lesson.video_path)
  const isPdf = !!(lesson.pdf_url || lesson.pdf_path)

  const inner = (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3.5 transition-all border-l-2",
        isCurrent
          ? "border-primary bg-primary/5"
          : accessible
          ? "border-transparent hover:border-zinc-200 hover:bg-zinc-50"
          : "border-transparent opacity-60"
      )}
    >
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
          isCurrent
            ? "bg-primary text-white"
            : accessible
            ? "bg-zinc-100 text-zinc-500"
            : "bg-zinc-100 text-zinc-300"
        )}
      >
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate transition-colors",
            isCurrent ? "text-primary" : accessible ? "text-zinc-800" : "text-zinc-400"
          )}
        >
          {lesson.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {isVideo && <Play size={9} className="text-zinc-400" fill="currentColor" />}
          {isPdf && !isVideo && <FileText size={9} className="text-zinc-400" />}
          {!isVideo && !isPdf && lesson.file_path && (
            <Archive size={9} className="text-zinc-400" />
          )}
          {lesson.is_free && !accessible && (
            <span className="text-[10px] font-semibold text-emerald-600">Free</span>
          )}
        </div>
      </div>

      {!accessible && <Lock size={12} className="text-zinc-300 shrink-0" />}
      {accessible && isCurrent && (
        <Play size={11} fill="currentColor" className="text-primary shrink-0" />
      )}
    </div>
  )

  if (accessible) {
    return (
      <Link
        href={`/courses/${courseId}/lessons/${lesson.id}`}
        ref={isCurrent ? activeRef : undefined}
        className="block"
      >
        {inner}
      </Link>
    )
  }

  return (
    <div ref={isCurrent ? activeRef : undefined} className="cursor-default">
      {inner}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function LessonViewerClient({
  courseId,
  lessonId,
}: {
  courseId: string
  lessonId: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: course, isLoading, isError } = useCourseById(courseId)
  const { data: purchased, isLoading: accessLoading } = useCourseAccess(courseId)
  const addToCart = useAddToCart()
  const inCart = useCartHasItem(courseId, "course")
  const [videoEnded, setVideoEnded] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const activeItemRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setVideoEnded(false)
  }, [lessonId])

  useEffect(() => {
    if (activeItemRef.current && sidebarRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [lessonId])

  if (isLoading || accessLoading) return <ViewerSkeleton />
  if (isError) return <ErrorState courseId={courseId} />
  if (!course) return <NotFoundState courseId={courseId} />

  const isFree = course.price === null || course.price === 0
  const hasFullAccess = isFree || !!purchased

  const lessons: CourseLesson[] = [...(course.lessons ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  )

  const currentIndex = lessons.findIndex((l) => l.id === lessonId)
  const lesson = lessons[currentIndex]

  if (!lesson) {
    router.replace(`/courses/${courseId}`)
    return null
  }

  const lessonAccessible = hasFullAccess || lesson.is_free
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
  const prevAccessible = prevLesson ? hasFullAccess || prevLesson.is_free : false
  const nextAccessible = nextLesson ? hasFullAccess || nextLesson.is_free : false

  const videoUrl = lesson.video_url ?? (lesson.video_path ? `${R2_BASE}/${lesson.video_path}` : null)
  const pdfUrl = lesson.pdf_url
    ? `${R2_BASE}/${lesson.pdf_url}`
    : lesson.pdf_path
    ? `${R2_BASE}/${lesson.pdf_path}`
    : null
  const fileUrl = lesson.file_path ? `${R2_BASE}/${lesson.file_path}` : null

  const hasVideo = !!videoUrl
  const hasPdf = !!pdfUrl
  const hasFile = !!fileUrl

  function handleAddToCart() {
    addToCart.mutate(
      { product_id: courseId, product_type: "course" },
      {
        onError: (err) => {
          if (err.message === "login_required") {
            toast.info("Please sign in to add items to cart.")
            router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
          }
        },
      }
    )
  }

  // ── Media priority rendering ───────────────────────────────────
  function renderPrimaryMedia() {
    if (!lessonAccessible) {
      return (
        <LockedLesson
          courseId={courseId}
          price={course!.price}
          onAddToCart={handleAddToCart}
          inCart={inCart}
        />
      )
    }

    // Case 1: has video → show player (or next-lesson card if video ended)
    if (hasVideo) {
      if (videoEnded && nextLesson && nextAccessible) {
        return (
          <NextLessonCard
            lesson={nextLesson}
            courseId={courseId}
            onDismiss={() => setVideoEnded(false)}
          />
        )
      }
      return <VideoPlayer url={videoUrl!} onEnded={() => setVideoEnded(true)} />
    }

    // Case 2: PDF only (no video) → PDF is primary
    if (hasPdf) return <PdfPrimaryCard pdfUrl={pdfUrl!} />

    // Case 3: files only → file as primary
    if (hasFile) return <FilesPrimarySection fileUrl={fileUrl!} />

    return (
      <div className="aspect-video w-full rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col items-center justify-center gap-3 text-zinc-400">
        <BookOpen size={48} strokeWidth={1} />
        <p className="text-sm font-medium">No content available for this lesson</p>
      </div>
    )
  }

  // Secondary downloads shown below the primary media (only when accessible)
  function renderSecondaryMedia() {
    if (!lessonAccessible) return null

    const items: { url: string; label: string }[] = []

    if (hasVideo) {
      if (hasPdf) items.push({ url: pdfUrl!, label: "Lesson PDF" })
      if (hasFile) items.push({ url: fileUrl!, label: "Lesson File" })
    } else if (hasPdf && hasFile) {
      items.push({ url: fileUrl!, label: "Additional Resource" })
    }

    if (items.length === 0) return null

    return (
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          Course Materials
        </h3>
        <div className="grid gap-2">
          {items.map((item) => (
            <FileCard key={item.url} url={item.url} label={item.label} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
        <Link
          href={`/courses/${courseId}`}
          className="flex items-center gap-1.5 hover:text-zinc-700 transition-colors min-w-0"
        >
          <ArrowLeft size={14} className="shrink-0" />
          <span className="truncate max-w-48">{course.title}</span>
        </Link>
        <ChevronRight size={12} className="shrink-0 text-zinc-300" />
        <span className="text-zinc-600 truncate max-w-48">{lesson.title}</span>
      </nav>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* ── LEFT: main content ── */}
        <div className="flex-1 min-w-0 space-y-6">
          {renderPrimaryMedia()}

          {/* Title + type badges */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 leading-snug">
                {lesson.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {lesson.is_free && !hasFullAccess && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    Free Preview
                  </span>
                )}
                {hasVideo && (
                  <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Play size={9} fill="currentColor" />
                    Video
                  </span>
                )}
                {hasPdf && (
                  <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <FileText size={9} />
                    PDF
                  </span>
                )}
                {hasFile && (
                  <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Archive size={9} />
                    File
                  </span>
                )}
              </div>
            </div>
            <span className="shrink-0 text-xs font-medium text-zinc-400 bg-zinc-100 px-3 py-1.5 rounded-full whitespace-nowrap tabular-nums">
              {currentIndex + 1} / {lessons.length}
            </span>
          </div>

          {lesson.description && (
            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
              {lesson.description}
            </p>
          )}

          {renderSecondaryMedia()}

          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100 gap-4">
            {prevLesson && prevAccessible ? (
              <Link
                href={`/courses/${courseId}/lessons/${prevLesson.id}`}
                className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors min-w-0"
              >
                <ChevronLeft size={16} className="shrink-0" />
                <span className="truncate max-w-44">{prevLesson.title}</span>
              </Link>
            ) : (
              <div />
            )}

            {nextLesson && nextAccessible ? (
              <Link
                href={`/courses/${courseId}/lessons/${nextLesson.id}`}
                className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors ml-auto min-w-0"
              >
                <span className="truncate max-w-44">{nextLesson.title}</span>
                <ChevronRight size={16} className="shrink-0" />
              </Link>
            ) : nextLesson && !nextAccessible ? (
              <span className="flex items-center gap-1.5 text-sm text-zinc-400 ml-auto">
                <Lock size={13} />
                Next lesson locked
              </span>
            ) : (
              <span className="text-sm text-zinc-500 flex items-center gap-1.5 ml-auto">
                <CheckCircle2 size={15} className="text-emerald-500" />
                Course complete
              </span>
            )}
          </div>
        </div>

        {/* ── RIGHT: sticky sidebar ── */}
        <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-20 lg:self-start">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Sidebar header */}
            <div className="px-4 py-4 bg-linear-to-b from-zinc-50 to-white border-b border-zinc-100">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap size={15} className="text-primary shrink-0" />
                <h2 className="text-xs font-bold text-zinc-600 uppercase tracking-wider truncate">
                  Course Content
                </h2>
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${((currentIndex + 1) / lessons.length) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-zinc-400 shrink-0 tabular-nums">
                  {currentIndex + 1}/{lessons.length}
                </span>
              </div>
            </div>

            {/* Lesson list */}
            <div
              ref={sidebarRef}
              className="divide-y divide-zinc-50 max-h-[calc(100vh-16rem)] overflow-y-auto"
            >
              {lessons.map((l, i) => (
                <SidebarLesson
                  key={l.id}
                  lesson={l}
                  index={i}
                  courseId={courseId}
                  isCurrent={l.id === lessonId}
                  accessible={hasFullAccess || l.is_free}
                  activeRef={
                    l.id === lessonId ? (el) => { activeItemRef.current = el } : undefined
                  }
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────
function ViewerSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-pulse">
      <div className="h-4 w-40 bg-zinc-200 rounded mb-6" />
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-5">
          <div className="aspect-video bg-zinc-200 rounded-2xl" />
          <div className="h-7 w-2/3 bg-zinc-200 rounded-lg" />
          <div className="h-4 w-24 bg-zinc-100 rounded-full" />
          <div className="h-14 w-full bg-zinc-100 rounded-xl" />
        </div>
        <div className="w-full lg:w-80">
          <div className="rounded-2xl border border-zinc-100 overflow-hidden">
            <div className="h-20 bg-zinc-50" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 border-t border-zinc-50 bg-white" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ErrorState({ courseId }: { courseId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-6">
      <AlertCircle size={48} className="text-red-300 mb-4" strokeWidth={1} />
      <p className="text-zinc-700 font-semibold text-lg">Something went wrong</p>
      <Link
        href={`/courses/${courseId}`}
        className="mt-6 text-sm text-primary underline underline-offset-2"
      >
        Back to course
      </Link>
    </div>
  )
}

function NotFoundState({ courseId }: { courseId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-6">
      <BookOpen size={48} className="text-zinc-200 mb-4" strokeWidth={1} />
      <p className="text-zinc-700 font-semibold text-lg">Lesson not found</p>
      <Link
        href={`/courses/${courseId}`}
        className="mt-6 text-sm text-primary underline underline-offset-2"
      >
        Back to course
      </Link>
    </div>
  )
}
