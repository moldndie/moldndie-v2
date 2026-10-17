import Image from "next/image"
import Link from "next/link"
import { FolderKanban, Images, Video } from "lucide-react"
import { mediaUrl } from "@/lib/video"
import type { PortfolioItem } from "@/services/portfolio.service"

function CaseStudyCard({ item, service }: { item: PortfolioItem; service?: string }) {
  const images = item.images ?? []
  const videoCount = (item.video_paths?.length ?? 0) + (item.video_urls?.length ?? 0)

  return (
    <Link
      href={`/services/case-studies/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm transition-all hover:border-primary hover:shadow-md"
    >
      <span className="relative block aspect-4/3 w-full bg-white">
        {images[0] ? (
          <Image
            src={mediaUrl(images[0])}
            alt={item.title}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center bg-zinc-50">
            <FolderKanban size={56} className="text-primary/20" strokeWidth={0.8} />
          </span>
        )}
      </span>
      <span className="flex flex-col gap-1.5 border-t border-zinc-100 p-4">
        {service && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{service}</span>
        )}
        <span className="text-base font-bold text-zinc-900 transition-colors group-hover:text-primary">
          {item.title}
        </span>
        {(images.length > 0 || videoCount > 0) && (
          <span className="flex gap-3 text-xs font-medium text-zinc-500">
            {images.length > 0 && (
              <span className="inline-flex items-center gap-1"><Images size={12} />{images.length}</span>
            )}
            {videoCount > 0 && (
              <span className="inline-flex items-center gap-1"><Video size={12} />{videoCount}</span>
            )}
          </span>
        )}
      </span>
    </Link>
  )
}

export default function PortfolioSection({
  items,
  services = {},
  heading = "Case Studies",
  viewAllHref,
}: {
  items: PortfolioItem[]
  /** service id → title, shown as a small label on each card */
  services?: Record<string, string>
  heading?: string | null
  viewAllHref?: string
}) {
  if (items.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-6 pb-10">
      {heading && (
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wide">{heading}</h2>
          {viewAllHref && (
            <Link href={viewAllHref} className="text-xs font-bold uppercase tracking-wider text-primary hover:underline">
              View all &rarr;
            </Link>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {items.map((item) => (
          <CaseStudyCard key={item.id} item={item} service={item.service_id ? services[item.service_id] : undefined} />
        ))}
      </div>
    </section>
  )
}
