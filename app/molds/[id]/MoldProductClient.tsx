"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import {
  Package,
  Play,
  Download,
  ShoppingCart,
  ChevronLeft,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
} from "lucide-react"
import { useMoldById, useMoldGallery } from "@/hooks/queries/useMolds"
import { useAddToCart, useCartHasItem } from "@/hooks/queries/useCart"

const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

type MoldMedia = {
  key: string
  type: "image" | "video"
}

// ── Skeleton ──────────────────────────────────────────────────
function SkeletonProductPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-pulse">
      <div className="h-4 w-32 bg-zinc-200 rounded mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-10 lg:gap-16">
        {/* Left */}
        <div className="space-y-4">
          <div className="aspect-square bg-zinc-200 rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-16 h-16 bg-zinc-200 rounded-lg" />
            ))}
          </div>
        </div>
        {/* Right */}
        <div className="space-y-5">
          <div className="h-3 w-20 bg-zinc-200 rounded" />
          <div className="h-8 w-3/4 bg-zinc-200 rounded" />
          <div className="h-10 w-28 bg-zinc-200 rounded" />
          <div className="space-y-2">
            <div className="h-3 bg-zinc-100 rounded w-full" />
            <div className="h-3 bg-zinc-100 rounded w-5/6" />
            <div className="h-3 bg-zinc-100 rounded w-4/6" />
          </div>
          <div className="h-12 bg-zinc-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ── Error state ───────────────────────────────────────────────
function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-6">
      <AlertCircle size={48} className="text-red-300 mb-4" strokeWidth={1} />
      <p className="text-zinc-700 font-semibold text-lg">Something went wrong</p>
      <p className="text-zinc-400 text-sm mt-1">We couldn't load this mold. Please try again.</p>
      <Link
        href="/molds"
        className="mt-6 text-sm text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
      >
        Back to Library
      </Link>
    </div>
  )
}

// ── Not found ─────────────────────────────────────────────────
function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-6">
      <Package size={48} className="text-zinc-200 mb-4" strokeWidth={1} />
      <p className="text-zinc-700 font-semibold text-lg">Mold not found</p>
      <p className="text-zinc-400 text-sm mt-1">This mold may have been removed or doesn't exist.</p>
      <Link
        href="/molds"
        className="mt-6 text-sm text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
      >
        Back to Library
      </Link>
    </div>
  )
}

// ── Thumbnail button ──────────────────────────────────────────
function Thumbnail({
  media,
  active,
  index,
  title,
  onClick,
}: {
  media: MoldMedia
  active: boolean
  index: number
  title: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all duration-150 ${
        active
          ? "border-primary shadow-sm"
          : "border-zinc-200 hover:border-zinc-400"
      }`}
    >
      {media.type === "video" ? (
        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
          <Play size={18} className="text-white" fill="white" />
        </div>
      ) : (
        <Image
          src={`${R2_BASE}/${media.key}`}
          alt={`${title} thumbnail ${index + 1}`}
          fill
          className="object-cover"
          sizes="64px"
        />
      )}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────
export default function MoldProductClient({ moldId }: { moldId: string }) {
  const { data: mold, isLoading, isError } = useMoldById(moldId)
  const { data: galleryItems = [] } = useMoldGallery(moldId)
  const [activeMedia, setActiveMedia] = useState<MoldMedia | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const addToCart = useAddToCart()
  const inCart = useCartHasItem(moldId, "mold")
  const router = useRouter()
  const pathname = usePathname()

  if (isLoading) return <SkeletonProductPage />
  if (isError) return <ErrorState />
  if (!mold) return <NotFoundState />

  const sortedGallery = [...galleryItems].sort((a, b) => a.position - b.position)

  // Main display: active thumbnail selection or fallback to preview image
  const mainMedia: MoldMedia | null =
    activeMedia ?? (mold.preview_image ? { key: mold.preview_image, type: "image" } : null)

  const isFree = mold.price === null || mold.price === 0

  async function handleDownload() {
    setIsDownloading(true)
    setDownloadError(null)
    try {
      const res = await fetch("/api/download-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moldId: mold!.id }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          toast.info("Please sign in to download this file.")
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
          return
        }
        const err = await res.json().catch(() => ({}))
        setDownloadError(err.error ?? "Download failed. Please try again.")
        return
      }

      const { downloadUrl } = await res.json()
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = mold!.title
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      setDownloadError("Network error. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  function handleAddToCart() {
    addToCart.mutate(
      {
        product_id: mold!.id,
        product_type: "mold",
        title: mold!.title,
        price: mold!.price ?? 0,
        image: mold!.preview_image ?? "",
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
      <nav className="flex items-center gap-2 text-sm text-zinc-400 mb-8">
        <Link href="/molds" className="flex items-center gap-1 hover:text-zinc-700 transition-colors">
          <ArrowLeft size={14} />
          Mold Library
        </Link>
        <ChevronLeft size={12} className="-rotate-180" />
        <span className="text-zinc-600 truncate max-w-50 sm:max-w-none">{mold.title}</span>
      </nav>

      {/* ── 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-10 lg:gap-16">
        {/* ── LEFT: Gallery ── */}
        <div className="space-y-4">
          {/* Main display */}
          <div className="aspect-square relative bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100">
            {mainMedia ? (
              mainMedia.type === "video" ? (
                <video
                  key={mainMedia.key}
                  controls
                  src={`${R2_BASE}/${mainMedia.key}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image
                  key={mainMedia.key}
                  src={`${R2_BASE}/${mainMedia.key}`}
                  alt={mold.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  priority
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={72} className="text-zinc-200" strokeWidth={1} />
              </div>
            )}
          </div>

          {/* Thumbnails — gallery items only, no preview image */}
          {sortedGallery.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {sortedGallery.map((item, i) => {
                const media: MoldMedia = { key: item.file_key, type: item.type }
                return (
                  <Thumbnail
                    key={item.id}
                    media={media}
                    active={activeMedia?.key === item.file_key}
                    index={i}
                    title={mold.title}
                    onClick={() => setActiveMedia(media)}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: Details (sticky on desktop) ── */}
        <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
          {/* Category */}
          {mold.category && (
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest">
              {mold.category.name}
            </span>
          )}

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 leading-tight">
            {mold.title}
          </h1>

          {/* Price block */}
          <div className="flex items-center gap-3">
            {isFree ? (
              <span className="text-3xl font-extrabold text-emerald-600">Free</span>
            ) : (
              <>
                <span className="text-3xl font-extrabold text-zinc-900">EGP {mold.price}</span>
                <span className="text-sm text-zinc-400">one-time purchase</span>
              </>
            )}
          </div>

          {/* Description */}
          {mold.description && (
            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
              {mold.description}
            </p>
          )}

          {/* Divider */}
          <div className="border-t border-zinc-100" />

          {/* Errors */}
          {downloadError && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {downloadError}
            </div>
          )}

          {/* CTA */}
          {isFree ? (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-xl transition-colors shadow-sm"
            >
              <Download size={18} />
              {isDownloading ? "Preparing download…" : "Free Download"}
            </button>
          ) : inCart ? (
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
              Add to Cart — EGP {mold.price}
            </button>
          )}

          {/* Trust note */}
          <p className="text-center text-xs text-zinc-400">
            {isFree
              ? "Free to download · Sign in required"
              : "Secure checkout · Instant access after payment"}
          </p>
          
        </div>
      </div>
         
    </div>
  )
}
