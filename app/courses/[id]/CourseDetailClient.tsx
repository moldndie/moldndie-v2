"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import {
  BookOpen,
  Lock,
  Play,
  ArrowLeft,
  ChevronLeft,
  AlertCircle,
  ShoppingCart,
  CheckCircle,
  FileText,
} from "lucide-react"
import { useCourseById, useCourseAccess } from "@/hooks/queries/useCourses"
import { useAddToCart, useCartHasItem } from "@/hooks/queries/useCart"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import { useCurrency } from "@/context/CurrencyContext"
import { displayPrice } from "@/lib/currency"

const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

// ── Skeleton ──────────────────────────────────────────────────
function SkeletonDetail() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-pulse">
      <div className="h-4 w-32 bg-zinc-200 rounded mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-10 lg:gap-16">
        <div className="space-y-4">
          <div className="aspect-video bg-zinc-200 rounded-2xl" />
          <div className="h-3 w-20 bg-zinc-200 rounded" />
          <div className="h-8 w-3/4 bg-zinc-200 rounded" />
          <div className="h-6 w-24 bg-zinc-200 rounded" />
          <div className="space-y-2">
            <div className="h-3 bg-zinc-100 rounded w-full" />
            <div className="h-3 bg-zinc-100 rounded w-5/6" />
            <div className="h-3 bg-zinc-100 rounded w-4/6" />
          </div>
          <div className="h-12 bg-zinc-200 rounded-xl" />
        </div>
        <div className="space-y-3">
          <div className="h-5 w-32 bg-zinc-200 rounded mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-zinc-100 rounded-xl" />
          ))}
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
        We couldn&apos;t load this course. Please try again.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
      >
        Back to Home
      </Link>
    </div>
  )
}

// ── Not found ─────────────────────────────────────────────────
function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-6">
      <BookOpen size={48} className="text-zinc-200 mb-4" strokeWidth={1} />
      <p className="text-zinc-700 font-semibold text-lg">Course not found</p>
      <p className="text-zinc-400 text-sm mt-1">
        This course may have been removed or doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
      >
        Back to Home
      </Link>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function CourseDetailClient({ courseId }: { courseId: string }) {
  const { data: course, isLoading, isError } = useCourseById(courseId)
  const { data: purchased, isLoading: accessLoading } = useCourseAccess(courseId)
  const addToCart = useAddToCart()
  const inCart = useCartHasItem(courseId, "course")
  const router = useRouter()
  const pathname = usePathname()

  if (isLoading || accessLoading) return <SkeletonDetail />
  if (isError) return <ErrorState />
  if (!course) return <NotFoundState />

  const { currency, rates } = useCurrency()
  const { text: priceText, isFree } = displayPrice(course.price, "EGP", currency, rates)
  const hasAccess = isFree || !!purchased
  const lessons = [...(course.lessons ?? [])].sort((a, b) => a.order_index - b.order_index)
  const firstAccessibleLesson = lessons.find((l) => hasAccess || l.is_free)
  const thumbnailSrc = course.thumbnail_url ? `${R2_BASE}/${course.thumbnail_url}` : null

  function handleAddToCart() {
    addToCart.mutate(
      {
        product_id: courseId,
        product_type: "course",
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
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* ── Breadcrumb ── */}
      <div className="mb-8">
        <PublicBreadcrumb crumbs={[{ label: "Academy", href: "/courses" }, { label: course.title }]} />
      </div>

      {/* ── 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-10 lg:gap-12">
        {/* ── LEFT: Info ── */}
        <div className="space-y-6">
          {/* Thumbnail */}
          <div className="aspect-video relative bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100">
            {thumbnailSrc ? (
              <Image
                src={thumbnailSrc}
                alt={course.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 55vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen size={64} className="text-zinc-200" strokeWidth={1} />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 leading-tight">
            {course.title}
          </h1>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-extrabold ${isFree ? "text-emerald-600" : "text-zinc-900"}`}>
              {priceText}
            </span>
            {!isFree && <span className="text-sm text-zinc-400">one-time purchase</span>}
          </div>

          {/* Description */}
          {course.description && (
            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
              {course.description}
            </p>
          )}

          <div className="border-t border-zinc-100" />

          {/* CTA */}
          {firstAccessibleLesson ? (
            <Link
              href={`/courses/${courseId}/lessons/${firstAccessibleLesson.id}`}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-base py-4 rounded-xl transition-colors shadow-sm"
            >
              <Play size={18} />
              {hasAccess ? "Start Course" : "Watch Free Preview"}
            </Link>
          ) : !hasAccess ? (
            inCart ? (
              <Link
                href="/cart"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base py-4 rounded-xl transition-colors shadow-sm"
              >
                <CheckCircle size={18} />
                View in Cart
              </Link>
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-base py-4 rounded-xl transition-colors shadow-sm"
              >
                <ShoppingCart size={18} />
                Buy Course — {priceText}
              </button>
            )
          ) : (
            <div className="w-full flex items-center justify-center gap-2 bg-zinc-100 text-zinc-400 font-bold text-base py-4 rounded-xl cursor-default">
              <BookOpen size={18} />
              No lessons yet
            </div>
          )}

          {/* Secondary buy button when a free preview exists but course is paid */}
          {!hasAccess && firstAccessibleLesson && (
            inCart ? (
              <Link
                href="/cart"
                className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-base py-4 rounded-xl transition-colors shadow-sm"
              >
                <CheckCircle size={18} />
                View in Cart
              </Link>
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-base py-4 rounded-xl transition-colors shadow-sm"
              >
                <ShoppingCart size={18} />
                Buy Course — {priceText}
              </button>
            )
          )}

          <p className="text-center text-xs text-zinc-400">
            {hasAccess
              ? "You have full access to this course"
              : "Secure checkout · Instant access after payment"}
          </p>
        </div>

        {/* ── RIGHT: Lessons ── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                Course Content
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
              </p>
            </div>

            {lessons.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <BookOpen size={32} className="text-zinc-200 mx-auto mb-2" strokeWidth={1} />
                <p className="text-sm text-zinc-400">No lessons added yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-50">
                {lessons.map((lesson, index) => {
                  const hasPdf = !!lesson.pdf_url
                  const lessonAccessible = hasAccess || lesson.is_free

                  if (lessonAccessible) {
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/courses/${courseId}/lessons/${lesson.id}`}
                          className="flex items-center gap-3 px-5 py-4 hover:bg-zinc-50 transition-colors group"
                        >
                          {/* Number */}
                          <span className="w-6 h-6 rounded-full bg-zinc-100 group-hover:bg-primary/10 flex items-center justify-center text-xs font-bold text-zinc-500 group-hover:text-primary shrink-0 transition-colors">
                            {index + 1}
                          </span>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-800 group-hover:text-primary truncate transition-colors">
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {lesson.is_free && !hasAccess && (
                                <span className="text-[10px] font-medium text-emerald-600">
                                  Free preview
                                </span>
                              )}
                              {hasPdf && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                                  <FileText size={10} />
                                  PDF included
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Icon */}
                          <Play
                            size={14}
                            className="text-zinc-300 group-hover:text-primary shrink-0 transition-colors"
                          />
                        </Link>
                      </li>
                    )
                  }

                  // Locked
                  return (
                    <li
                      key={lesson.id}
                      className="flex items-center gap-3 px-5 py-4 opacity-60 cursor-default"
                    >
                      <span className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-500 truncate">
                          {lesson.title}
                        </p>
                      </div>
                      <Lock size={13} className="text-zinc-300 shrink-0" />
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
