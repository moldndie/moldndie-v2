import { FileText, FileSpreadsheet, Presentation, Video, Archive, File, Download } from "lucide-react"
import { getFileUrl } from "@/lib/utils"
import RichTextRenderer from "@/components/editor/RichTextRenderer"
import type { BlogBlock } from "@/types"

interface BlockRendererProps {
  blocks: BlogBlock[]
}

type TwoColRegion = { kind: "two-column"; left: BlogBlock[]; right: BlogBlock[]; ratio: number }
type Row = BlogBlock | TwoColRegion

const DEFAULT_COLUMN_RATIO = 50

export function BlockRenderer({ blocks }: BlockRendererProps) {
  const sorted = [...blocks].sort((a, b) => a.order_index - b.order_index)

  // Group a run of consecutive two-column blocks into one region with two
  // independent, continuously-flowing stacks. Every other block stands alone.
  const rows: Row[] = []
  let i = 0
  while (i < sorted.length) {
    if (sorted[i].layout === "two-column") {
      const run: BlogBlock[] = []
      while (i < sorted.length && sorted[i].layout === "two-column") {
        run.push(sorted[i])
        i++
      }
      rows.push({
        kind: "two-column",
        left: run.filter((b) => b.column_position !== "right"),
        right: run.filter((b) => b.column_position === "right"),
        ratio: run[0].column_ratio ?? DEFAULT_COLUMN_RATIO,
      })
    } else {
      rows.push(sorted[i])
      i++
    }
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => {
        if ("kind" in row) {
          const key = row.left[0]?.id ?? row.right[0]?.id ?? String(Math.random())
          return (
            <div
              key={key}
              className="flex flex-col gap-4 sm:grid sm:gap-4"
              style={{ gridTemplateColumns: `${row.ratio}fr ${100 - row.ratio}fr` }}
            >
              <div className="space-y-4">
                {row.left.map((b) => <BlockItem key={b.id} block={b} />)}
              </div>
              <div className="space-y-4">
                {row.right.map((b) => <BlockItem key={b.id} block={b} />)}
              </div>
            </div>
          )
        }
        return <BlockItem key={row.id} block={row} />
      })}
    </div>
  )
}

function BlockItem({ block }: { block: BlogBlock }) {
  switch (block.block_type) {
    case "heading": {
      const c = block.content as { text?: string; level?: number }
      const level = (c.level ?? 2) as 1 | 2 | 3
      const sizeClass = { 1: "text-3xl", 2: "text-2xl", 3: "text-xl" }[level] ?? "text-xl"
      const Tag = `h${level}` as "h1" | "h2" | "h3"
      return <Tag className={`font-bold text-zinc-900 ${sizeClass}`}>{c.text}</Tag>
    }
    case "paragraph": {
      // Rendered as rich text, not a text child — otherwise links the author
      // inserted come out as escaped markup instead of working anchors.
      const c = block.content as { text?: string }
      return <RichTextRenderer content={c.text} className="text-zinc-700" />
    }
    case "image": {
      const c = block.content as { url?: string; caption?: string }
      if (!c.url || c.url.includes("r2.cloudflarestorage.com")) return null
      return (
        <figure className="max-w-2xl mx-auto">
          <img src={c.url} alt={c.caption ?? ""} className="w-full rounded-xl" />
          {c.caption && (
            <figcaption className="mt-2 text-left text-sm text-zinc-500">{c.caption}</figcaption>
          )}
        </figure>
      )
    }
    case "quote": {
      const c = block.content as { text?: string; author?: string }
      return (
        <blockquote className="border-l-4 border-zinc-300 pl-4 py-1">
          <RichTextRenderer content={c.text} className="italic text-zinc-700" />
          {c.author && (
            <cite className="mt-1 block text-sm text-zinc-500 not-italic">— {c.author}</cite>
          )}
        </blockquote>
      )
    }
    case "list": {
      const c = block.content as { items?: string[] }
      return (
        <ul className="list-disc pl-5 space-y-1">
          {(c.items ?? []).map((item, i) => (
            <li key={i} className="text-zinc-700">{item}</li>
          ))}
        </ul>
      )
    }
    case "video": {
      const c = block.content as { url?: string }
      if (!c.url) return null
      return (
        <div className="max-w-2xl mx-auto aspect-video w-full overflow-hidden rounded-xl bg-zinc-100">
          <iframe
            src={toEmbedUrl(c.url)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }
    case "file": {
      const c = block.content as { file_path?: string; file_name?: string; file_size?: number; file_type?: string }
      if (!c.file_path) return null
      const mime = c.file_type ?? ""
      const Icon = mime.startsWith("video/") ? Video
        : mime.includes("pdf") ? FileText
        : mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("xls") ? FileSpreadsheet
        : mime.includes("presentation") || mime.includes("powerpoint") || mime.includes("ppt") ? Presentation
        : mime.includes("zip") || mime.includes("rar") ? Archive
        : File
      const sizeLabel = c.file_size
        ? c.file_size < 1024 * 1024
          ? `${(c.file_size / 1024).toFixed(1)} KB`
          : `${(c.file_size / (1024 * 1024)).toFixed(1)} MB`
        : null

      if (mime.startsWith("video/")) {
        return (
          <div className="max-w-2xl mx-auto rounded-xl overflow-hidden bg-zinc-100">
            <video controls className="w-full" preload="metadata">
              <source src={getFileUrl(c.file_path)} type={mime} />
            </video>
            {c.file_name && (
              <p className="px-3 py-2 text-xs text-zinc-500">{c.file_name}</p>
            )}
          </div>
        )
      }

      return (
        <a
          href={getFileUrl(c.file_path)}
          target="_blank"
          rel="noopener noreferrer"
          download={c.file_name}
          className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 hover:border-primary/30 hover:bg-primary/5 transition-colors max-w-lg"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white border border-zinc-200 group-hover:border-primary/30 transition-colors">
            <Icon className="size-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900 truncate group-hover:text-primary transition-colors">
              {c.file_name ?? "Download file"}
            </p>
            {sizeLabel && <p className="text-xs text-zinc-400 mt-0.5">{sizeLabel}</p>}
          </div>
          <Download className="size-4 text-zinc-400 group-hover:text-primary transition-colors shrink-0" />
        </a>
      )
    }
    default:
      return null
  }
}

function toEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  return url
}
