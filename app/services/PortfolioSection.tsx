"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { FolderKanban, Images, Video } from "lucide-react"
import { mediaUrl } from "@/lib/video"
import RichTextRenderer from "@/components/editor/RichTextRenderer"
import MediaGallery from "@/components/services/MediaGallery"
import { Modal } from "@/components/ui/modal"
import type { PortfolioItem } from "@/services/portfolio.service"
import { Button } from "@/components/ui/button"

function PortfolioTile({ item, onOpen }: { item: PortfolioItem; onOpen: () => void }) {
  const images = item.images ?? []
  const videoCount = (item.video_paths?.length ?? 0) + (item.video_urls?.length ?? 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Button
        variant="unstyled"
        type="button"
        onClick={onOpen}
        className="group flex w-full flex-col overflow-hidden rounded-xl border border-zinc-100 bg-white text-left shadow-sm transition-all hover:border-primary hover:shadow-md"
      >
        <span className="relative block aspect-4/3 w-full bg-zinc-50">
          {images[0] ? (
            <Image
              src={mediaUrl(images[0])}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center">
              <FolderKanban size={36} className="text-primary/20" strokeWidth={1} />
            </span>
          )}
        </span>
        <span className="flex flex-col gap-1.5 p-3">
          <span className="line-clamp-2 text-sm font-bold text-zinc-900">{item.title}</span>
          {(images.length > 0 || videoCount > 0) && (
            <span className="flex gap-2 text-[11px] font-medium text-zinc-500">
              {images.length > 0 && (
                <span className="inline-flex items-center gap-1"><Images size={11} />{images.length}</span>
              )}
              {videoCount > 0 && (
                <span className="inline-flex items-center gap-1"><Video size={11} />{videoCount}</span>
              )}
            </span>
          )}
        </span>
      </Button>
    </motion.div>
  )
}

export default function PortfolioSection({
  items,
  heading = "Our Work",
}: {
  items: PortfolioItem[]
  heading?: string
}) {
  const [open, setOpen] = useState<PortfolioItem | null>(null)

  if (items.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-6 pb-10">
      <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wide mb-4">
        {heading}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <PortfolioTile key={item.id} item={item} onOpen={() => setOpen(item)} />
        ))}
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ""} size="xl">
        {open && (
          <div className="space-y-4">
            <MediaGallery
              key={open.id}
              title={open.title}
              images={open.images ?? []}
              videos={open.video_paths}
              videoUrls={open.video_urls}
            />
            {open.description && (
              <RichTextRenderer content={open.description} className="text-sm text-zinc-600" />
            )}
          </div>
        )}
      </Modal>
    </section>
  )
}
