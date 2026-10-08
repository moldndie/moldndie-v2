"use client"

import { useState } from "react"
import Image from "next/image"
import { FolderKanban } from "lucide-react"
import { getYouTubeEmbedUrl, mediaUrl } from "@/lib/video"
import { Button } from "@/components/ui/button"

interface Props {
  title: string
  /** R2 keys or legacy full URLs */
  images: string[]
  /** R2 keys */
  videos?: string[]
  /** External links (YouTube embeds, otherwise a plain link) */
  videoUrls?: string[]
  /** Show the placeholder icon when there is no media at all */
  placeholder?: boolean
}

export default function MediaGallery({ title, images, videos = [], videoUrls = [], placeholder }: Props) {
  const [active, setActive] = useState(0)
  const hasVideo = videos.length > 0 || videoUrls.length > 0

  if (images.length === 0 && !hasVideo) {
    return placeholder ? (
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 flex items-center justify-center">
        <FolderKanban size={72} className="text-primary/20" strokeWidth={0.8} />
      </div>
    ) : null
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <>
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-zinc-100 bg-white">
            <Image
              src={mediaUrl(images[active] ?? images[0])}
              alt={title}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {images.map((src, i) => (
                <Button
                  variant="unstyled"
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`relative size-14 shrink-0 overflow-hidden rounded-lg border transition-colors ${
                    i === active ? "border-primary ring-2 ring-primary/30" : "border-zinc-200 [@media(hover:hover)]:hover:border-primary"
                  }`}
                >
                  <Image src={mediaUrl(src)} alt="" fill className="object-cover" sizes="56px" />
                </Button>
              ))}
            </div>
          )}
        </>
      )}

      {videos.map((key) => (
        <video
          key={key}
          src={mediaUrl(key)}
          controls
          preload="metadata"
          className="aspect-video w-full rounded-xl bg-zinc-950"
        />
      ))}

      {videoUrls.map((url) => {
        const embed = getYouTubeEmbedUrl(url)
        return embed ? (
          <div key={url} className="aspect-video w-full overflow-hidden rounded-xl bg-zinc-950">
            <iframe
              src={embed}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="size-full"
            />
          </div>
        ) : (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm font-semibold text-primary hover:underline"
          >
            Watch video
          </a>
        )
      })}
    </div>
  )
}
