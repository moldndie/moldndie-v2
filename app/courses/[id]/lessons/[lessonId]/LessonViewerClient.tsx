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
  BookOpen,
  ArrowLeft,
  AlertCircle,
  ShoppingCart,
} from "lucide-react"
import { useCourseById, useCourseAccess } from "@/hooks/queries/useCourses"
import { useAddToCart, useCartHasItem } from "@/hooks/queries/useCart"
import { cn } from "@/lib/utils"
import type { CourseLesson } from "@/types"

const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

// ── YouTube embed helper ───────────────────────────────────────
function getYouTubeEmbedUrl(url: string): string | null {
  const short = url.match(/youtu\.be\/([^?&]+)/)
  if (short) return `https://www.youtube.com/embed/${short[1]}`
  const long = url.match(/[?&]v=([^&]+)/)
  if (long) return `https://www.youtube.com/embed/${long[1]}`
  return null
}

// ── Video player ───────────────────────────────────────────────
function VideoPlayer({ url, onEnded }: { url: string; onEnded?: () => void }) {
  const embedUrl = getYouTubeEmbedUrl(url)
  if (embedUrl) {
    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md">
        <iframe
          src={embedUrl}
          title="Lesson video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    )
  }
  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md">
      <video
        src={url}
        controls
        className="w-full h-full"
        playsInline
        onEnded={onEnded}
      />
    </div>
  )
}

// ── Next lesson end-of-video card ──────────────────────────────
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
    <div className="aspect-video w-full rounded-xl bg-zinc-900 flex flex-col items-center justify-center gap-4 text-center px-8 relative">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 text-xs"
      >
        ✕
      </button>
      <p className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Up Next</p>
      <p className="text-white text-lg font-bold max-w-xs line-clamp-2">{lesson.title}</p>
      <Link
        href={`/courses/${courseId}/lessons/${lesson.id}`}
        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
      >
        <Play size={15} />
        Play Next
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
  const base = "flex items-center gap-3 px-4 py-3 transition-colors text-left w-full"

  const inner = (
    <>
      <span
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
          isCurrent
            ? "bg-primary text-white"
            : accessible
            ? "bg-zinc-100 text-zinc-500 group-hover:bg-primary/10 group-hover:text-primary"
            : "bg-zinc-100 text-zinc-300"
        )}
      >
        {index + 1}
      </span>
      <p
        className={cn(
          "flex-1 text-sm font-medium truncate transition-colors",
          isCurrent
            ? "text-primary"
            : accessible
            ? "text-zinc-800 group-hover:text-primary"
            : "text-zinc-400"
        )}
      >
        {lesson.title}
      </p>
      {lesson.is_free && !accessible && (
        <span className="text-[10px] font-medium text-emerald-600 shrink-0">Free</span>
      )}
      {!accessible && <Lock size={12} className="text-zinc-300 shrink-0" />}
      {accessible && isCurrent && <Play size={12} className="text-primary shrink-0" />}
    </>
  )

  if (accessible) {
    return (
      <Link
        href={`/courses/${courseId}/lessons/${lesson.id}`}
        ref={isCurrent ? activeRef : undefined}
        className={cn(base, "group", isCurrent ? "bg-primary/5" : "hover:bg-zinc-50")}
      >
        {inner}
      </Link>
    )
  }

  return (
    <div
      ref={isCurrent ? activeRef : undefined}
      className={cn(base, "cursor-default opacity-70")}
    >
      {inner}
    </div>
  )
}

// ── Locked state ───────────────────────────────────────────────
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
    <div className="aspect-video w-full rounded-xl bg-zinc-50 border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-4 text-center px-8">
      <Lock size={40} className="text-zinc-300" strokeWidth={1.5} />
      <div>
        <p className="text-base font-semibold text-zinc-700">This lesson is locked</p>
        <p className="text-sm text-zinc-400 mt-1">Purchase the course to unlock all lessons.</p>
      </div>
      {inCart ? (
        <Link
          href="/cart"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          View in Cart
        </Link>
      ) : (
        <button
          onClick={onAddToCart}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <ShoppingCart size={15} />
          {price ? `Buy Course — $${price}` : "Buy Course"}
        </button>
      )}
      <Link
        href={`/courses/${courseId}`}
        className="text-sm text-zinc-400 hover:text-zinc-600 underline underline-offset-2"
      >
        Back to course
      </Link>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────
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

  // Reset video-ended state on lesson change
  useEffect(() => {
    setVideoEnded(false)
  }, [lessonId])

  // Auto-scroll sidebar to active lesson
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

  const pdfUrl = lesson.pdf_url ? `${R2_BASE}/${lesson.pdf_url}` : null

  function handleAddToCart() {
    addToCart.mutate(
      {
        product_id: courseId,
        product_type: "course",
        title: course!.title,
        price: course!.price ?? 0,
        image: course!.thumbnail_url ?? "",
      },
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
        <Link
          href={`/courses/${courseId}`}
          className="flex items-center gap-1 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft size={14} />
          <span className="truncate max-w-48">{course.title}</span>
        </Link>
        <ChevronRight size={12} />
        <span className="text-zinc-600 truncate max-w-48">{lesson.title}</span>
      </nav>

      {/* Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── LEFT: Main content ── */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Video / Next suggestion / Locked */}
          {lessonAccessible ? (
            videoEnded && nextLesson && nextAccessible ? (
              <NextLessonCard
                lesson={nextLesson}
                courseId={courseId}
                onDismiss={() => setVideoEnded(false)}
              />
            ) : lesson.video_url ? (
              <VideoPlayer url={lesson.video_url} onEnded={() => setVideoEnded(true)} />
            ) : (
              <div className="aspect-video w-full rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col items-center justify-center gap-2 text-zinc-400">
                <BookOpen size={40} strokeWidth={1} />
                <p className="text-sm">No video for this lesson</p>
              </div>
            )
          ) : (
            <LockedLesson
              courseId={courseId}
              price={course.price}
              onAddToCart={handleAddToCart}
              inCart={inCart}
            />
          )}

          {/* Lesson title + progress */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 leading-tight">
                {lesson.title}
              </h1>
              {lesson.is_free && !hasFullAccess && (
                <span className="inline-block mt-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Free preview
                </span>
              )}
            </div>
            {/* Progress indicator */}
            <span className="shrink-0 text-xs font-medium text-zinc-400 bg-zinc-100 px-3 py-1.5 rounded-full whitespace-nowrap">
              {currentIndex + 1} / {lessons.length}
            </span>
          </div>

          {/* PDF download */}
          {lessonAccessible && pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-4 py-2.5 rounded-xl transition-colors"
            >
              <FileText size={16} />
              Download PDF
            </a>
          )}

          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
            {prevLesson && prevAccessible ? (
              <Link
                href={`/courses/${courseId}/lessons/${prevLesson.id}`}
                className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                <ChevronLeft size={16} />
                <span className="truncate max-w-48">{prevLesson.title}</span>
              </Link>
            ) : (
              <div />
            )}

            {nextLesson && nextAccessible ? (
              <Link
                href={`/courses/${courseId}/lessons/${nextLesson.id}`}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <span className="truncate max-w-48">{nextLesson.title}</span>
                <ChevronRight size={16} />
              </Link>
            ) : nextLesson && !nextAccessible ? (
              <span className="flex items-center gap-1.5 text-sm text-zinc-400 cursor-default">
                <Lock size={13} />
                Next lesson locked
              </span>
            ) : (
              <span className="text-sm text-zinc-400">You&apos;ve reached the end</span>
            )}
          </div>
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-20 lg:self-start">
          <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-zinc-100">
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Course Content
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Lesson {currentIndex + 1} of {lessons.length}
              </p>
            </div>

            <div
              ref={sidebarRef}
              className="divide-y divide-zinc-50 max-h-[calc(100vh-12rem)] overflow-y-auto"
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
                    l.id === lessonId
                      ? (el) => { activeItemRef.current = el }
                      : undefined
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

// ── Skeletons & states ─────────────────────────────────────────
function ViewerSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-pulse">
      <div className="h-4 w-40 bg-zinc-200 rounded mb-6" />
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="aspect-video bg-zinc-200 rounded-xl" />
          <div className="h-6 w-2/3 bg-zinc-200 rounded" />
          <div className="h-10 w-36 bg-zinc-100 rounded-xl" />
        </div>
        <div className="w-full lg:w-80 space-y-2">
          <div className="h-12 bg-zinc-100 rounded-xl" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-zinc-50 rounded" />
          ))}
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
      <Link href={`/courses/${courseId}`} className="mt-6 text-sm text-primary underline underline-offset-2">
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
      <Link href={`/courses/${courseId}`} className="mt-6 text-sm text-primary underline underline-offset-2">
        Back to course
      </Link>
    </div>
  )
}
