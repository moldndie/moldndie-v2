"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { getFileUrl } from "@/lib/utils"
import RichTextRenderer from "@/components/editor/RichTextRenderer"
import type { PortfolioItem } from "@/services/portfolio.service"

function getYouTubeEmbedUrl(url: string): string | null {
  const short = url.match(/youtu\.be\/([^?&]+)/)
  if (short) return `https://www.youtube.com/embed/${short[1]}?rel=0&modestbranding=1`
  const long = url.match(/[?&]v=([^&]+)/)
  if (long) return `https://www.youtube.com/embed/${long[1]}?rel=0&modestbranding=1`
  return null
}

function PortfolioCard({ item }: { item: PortfolioItem }) {
  const images = item.images ?? []
  const [active, setActive] = useState(0)
  const embedUrl = item.video_url ? getYouTubeEmbedUrl(item.video_url) : null

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col rounded-2xl overflow-hidden border border-zinc-100 bg-white shadow-sm hover:shadow-md transition-all duration-200"
    >
      {images.length > 0 && (
        <>
          <div className="relative aspect-video bg-white overflow-hidden">
            <Image
              src={getFileUrl(images[active])}
              alt={item.title}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide px-3 pt-3">
              {images.map((key, i) => (
                <button
                  key={`${key}-${i}`}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`relative size-12 shrink-0 overflow-hidden rounded-lg border transition-colors ${
                    i === active ? "border-primary" : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <Image
                    src={getFileUrl(key)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="text-base font-bold text-zinc-900">{item.title}</h3>

        {item.description && (
          <RichTextRenderer content={item.description} className="text-sm text-zinc-600" />
        )}

        {embedUrl ? (
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-zinc-950">
            <iframe
              src={embedUrl}
              title={item.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="size-full"
            />
          </div>
        ) : item.video_path ? (
          <video
            src={getFileUrl(item.video_path)}
            controls
            preload="metadata"
            className="aspect-video w-full rounded-xl bg-zinc-950"
          />
        ) : item.video_url ? (
          <a
            href={item.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Watch video
          </a>
        ) : null}
      </div>
    </motion.article>
  )
}

export default function PortfolioSection({
  items,
  heading = "Our Work",
}: {
  items: PortfolioItem[]
  heading?: string
}) {
  if (items.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-6 pb-10">
      <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wide mb-4">
        {heading}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <PortfolioCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
