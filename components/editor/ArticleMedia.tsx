"use client"

import { Node } from "@tiptap/core"
import Document from "@tiptap/extension-document"
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react"
import { Paperclip, Video } from "lucide-react"

// Media cards are top-level only. Saving writes them back as ordinary blog
// blocks, so the existing public renderer still handles playback and downloads.
export const ArticleDocument = Document.extend({ content: "(block | articleMedia)+" })

const mediaFields = ["kind", "url", "file_path", "file_name", "file_type", "file_size"] as const

function ArticleMediaView({ node, selected }: NodeViewProps) {
  const { kind, url, file_name } = node.attrs
  const isVideo = kind === "video"
  const Icon = isVideo ? Video : Paperclip
  return (
    <NodeViewWrapper
      contentEditable={false}
      className="my-3 flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
      data-drag-handle
    >
      <Icon className="size-5 shrink-0 text-zinc-500" aria-hidden="true" />
      <div className="min-w-0">
        <div className="text-xs font-semibold text-zinc-500">{isVideo ? "Video embed" : "Attachment"}</div>
        <div className="truncate text-zinc-900" title={isVideo ? url : file_name}>
          {isVideo ? url : file_name || "Download file"}
        </div>
      </div>
      {selected && <span className="ml-auto shrink-0 text-xs text-zinc-500">Delete to remove</span>}
    </NodeViewWrapper>
  )
}

export const ArticleMedia = Node.create({
  name: "articleMedia",
  group: "articleMedia",
  atom: true,
  draggable: true,
  addAttributes() {
    return Object.fromEntries(mediaFields.map((field) => [field, {
      default: null,
      parseHTML: (element: HTMLElement) => element.getAttribute(`data-${field}`),
      renderHTML: (attrs: Record<string, unknown>) => ({ [`data-${field}`]: attrs[field] }),
    }]))
  },
  parseHTML() {
    return [{ tag: "div[data-article-media]" }]
  },
  renderHTML({ node, HTMLAttributes }) {
    const label = node.attrs.kind === "video" ? node.attrs.url : node.attrs.file_name
    return ["div", { ...HTMLAttributes, "data-article-media": "" }, String(label ?? "")]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ArticleMediaView)
  },
})
