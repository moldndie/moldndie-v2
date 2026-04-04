import type { BlogBlock } from "@/types"

interface BlockRendererProps {
  blocks: BlogBlock[]
}

type Row = BlogBlock | [BlogBlock, BlogBlock | null]

export function BlockRenderer({ blocks }: BlockRendererProps) {
  const sorted = [...blocks].sort((a, b) => a.order_index - b.order_index)

  // Group into rows: pair consecutive left+right two-column blocks
  const rows: Row[] = []
  let i = 0
  while (i < sorted.length) {
    const block = sorted[i]
    if (block.layout === "two-column" && block.column_position === "left") {
      const next = sorted[i + 1]
      if (next && next.layout === "two-column" && next.column_position === "right") {
        rows.push([block, next])
        i += 2
      } else {
        rows.push([block, null])
        i += 1
      }
    } else {
      rows.push(block)
      i += 1
    }
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => {
        if (Array.isArray(row)) {
          const [left, right] = row
          return (
            <div key={left.id} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BlockItem block={left} />
              {right ? <BlockItem block={right} /> : <div />}
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
      const c = block.content as { text?: string }
      return <p className="text-zinc-700 leading-relaxed">{c.text}</p>
    }
    case "image": {
      const c = block.content as { url?: string; caption?: string }
      if (!c.url) return null
      return (
        <figure className="max-w-2xl mx-auto">
          <img src={c.url} alt={c.caption ?? ""} className="w-full rounded-xl" />
          {c.caption && (
            <figcaption className="mt-2 text-center text-sm text-zinc-500">{c.caption}</figcaption>
          )}
        </figure>
      )
    }
    case "quote": {
      const c = block.content as { text?: string; author?: string }
      return (
        <blockquote className="border-l-4 border-zinc-300 pl-4 py-1">
          <p className="italic text-zinc-700">{c.text}</p>
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
    default:
      return null
  }
}

function toEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  return url
}
