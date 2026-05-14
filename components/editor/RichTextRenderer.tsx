import { generateHTML } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Image from "@tiptap/extension-image"
import Youtube from "@tiptap/extension-youtube"
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"

const extensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3, 4] }, link: false, underline: false }),
  Underline,
  Link.configure({ HTMLAttributes: { class: "text-primary underline hover:no-underline" } }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Image.configure({ inline: false }),
  Youtube.configure({ nocookie: true }),
  Table.configure({ resizable: false }),
  TableRow,
  TableCell,
  TableHeader,
  TextStyle,
  Color,
]

function isTiptapDocEmpty(content: Record<string, unknown>): boolean {
  const nodes = content.content as Array<{ type: string; content?: unknown[] }> | undefined
  if (!nodes || nodes.length === 0) return true
  // A single empty paragraph is also considered empty
  if (nodes.length === 1 && nodes[0].type === "paragraph") {
    const children = nodes[0].content
    return !children || children.length === 0
  }
  return false
}

interface RichTextRendererProps {
  content: Record<string, unknown> | null | undefined
  className?: string
  emptyMessage?: string
}

export default function RichTextRenderer({
  content,
  className,
  emptyMessage = "Content coming soon.",
}: RichTextRendererProps) {
  const isEmpty = !content || isTiptapDocEmpty(content)

  if (isEmpty) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-zinc-400 italic">{emptyMessage}</p>
      </div>
    )
  }

  let html = ""
  try {
    html = generateHTML(content as Parameters<typeof generateHTML>[0], extensions)
  } catch {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-zinc-400 italic">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div
      className={`cms-content ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
