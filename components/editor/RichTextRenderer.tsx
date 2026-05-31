"use client"

import { useState, useEffect } from "react"
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

// Extensions are configured at module level — they don't touch the DOM.
// Only generateHTML → getHTMLFromFragment uses document/DOM APIs, which is
// why we call it inside useEffect (client-only) rather than during SSR.
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

function parseContent(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null
  if (typeof raw === "string") {
    try { return JSON.parse(raw) as Record<string, unknown> } catch { return null }
  }
  if (typeof raw === "object") return raw as Record<string, unknown>
  return null
}

function isTiptapDocEmpty(content: Record<string, unknown>): boolean {
  const nodes = content.content as Array<{ type: string; content?: unknown[] }> | undefined
  if (!nodes || nodes.length === 0) return true
  if (nodes.length === 1 && nodes[0].type === "paragraph") {
    const children = nodes[0].content
    return !children || children.length === 0
  }
  return false
}

interface RichTextRendererProps {
  content: unknown
  className?: string
  emptyMessage?: string
}

export default function RichTextRenderer({ content, className, emptyMessage = "" }: RichTextRendererProps) {
  // null  = not yet rendered (SSR / before hydration)
  // ""    = rendered but empty / error
  // str   = valid HTML
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    const parsed = parseContent(content)
    if (!parsed || isTiptapDocEmpty(parsed)) { setHtml(""); return }

    // generateHTML calls getHTMLFromFragment which uses document.createElement —
    // safe here because useEffect only runs in the browser.
    import("@tiptap/core").then(({ generateHTML }) => {
      try {
        setHtml(generateHTML(parsed as Parameters<typeof generateHTML>[0], extensions))
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("[RichTextRenderer] generateHTML failed:", err)
        }
        setHtml("")
      }
    })
  }, [content])

  if (html === null) return null

  if (html === "") {
    if (!emptyMessage) return null
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
