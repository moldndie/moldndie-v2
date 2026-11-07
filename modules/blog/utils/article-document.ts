import type { JSONContent } from "@tiptap/react"
import { getVideoPlacement, getVideoWidthPercent, MAX_VIDEO_WIDTH_PERCENT } from "@/components/editor/article-video"
import { fromDoc, toDoc } from "@/lib/richtext"
import type { BlogBlock } from "@/types/blog"
import type { EditorBlock } from "../types"
import { blocksToSections } from "./sections"

const textNodes = (text: unknown): JSONContent[] =>
  typeof text === "string" && text ? [{ type: "text", text }] : []

function richNodes(value: unknown): JSONContent[] {
  const nodes = toDoc(value)?.content
  return Array.isArray(nodes) ? nodes : []
}

function blockNodes({ block_type, content }: EditorBlock): JSONContent[] {
  switch (block_type) {
    case "paragraph":
      return richNodes(content.text)
    case "heading":
      return [{ type: "heading", attrs: { level: content.level ?? 2 }, content: textNodes(content.text) }]
    case "image":
      return content.url
        ? [{ type: "image", attrs: { src: content.url, caption: content.caption, placement: "block" } }]
        : []
    case "quote": {
      const nodes = [...richNodes(content.text)]
      if (content.author) nodes.push({ type: "paragraph", content: textNodes(`— ${content.author}`) })
      return nodes.length ? [{ type: "blockquote", content: nodes }] : []
    }
    case "list":
      return Array.isArray(content.items) && content.items.length
        ? [{
            type: "bulletList",
            content: content.items.map((item) => ({
              type: "listItem",
              content: [{ type: "paragraph", content: textNodes(item) }],
            })),
          }]
        : []
    case "file":
      return content.file_path ? [{ type: "articleMedia", attrs: { kind: "file", ...content } }] : []
    case "video":
      if (content.file_path) return [{ type: "articleMedia", attrs: { ...content, kind: "file" } }]
      return content.url ? [{ type: "articleMedia", attrs: { kind: "video", url: content.url } }] : []
  }
}

export function blogBlocksToDocument(blocks: BlogBlock[]): JSONContent {
  const sections = blocksToSections([...blocks].sort((a, b) => a.order_index - b.order_index))
  const content = sections.flatMap((section) => {
    if (section.type === "full-width") return blockNodes(section.block)

    // Carry over the common layout where one image sits beside the text.
    for (const side of ["left", "right"] as const) {
      const images = section[side]
      const other = section[side === "left" ? "right" : "left"]
      if (images.length !== 1 || images[0].block_type !== "image" || !other.length) continue
      const [image] = blockNodes(images[0])
      if (!image) continue
      image.attrs = {
        ...image.attrs,
        placement: side,
        widthPercent: side === "left" ? section.ratio : 100 - section.ratio,
      }
      return [image, ...other.flatMap(blockNodes)]
    }
    return [...section.left, ...section.right].flatMap(blockNodes)
  })

  if (content.at(-1)?.type !== "paragraph") content.push({ type: "paragraph" })
  return { type: "doc", content }
}

type SavedBlock = Pick<BlogBlock, "block_type" | "content" | "order_index">

export function documentToBlogBlocks(doc: JSONContent): SavedBlock[] {
  const blocks: SavedBlock[] = []
  let writing: JSONContent[] = []

  function append(block_type: SavedBlock["block_type"], content: SavedBlock["content"]) {
    blocks.push({ block_type, content, order_index: blocks.length })
  }

  function flushWriting() {
    const text = fromDoc({ type: "doc", content: writing })
    if (text) append("paragraph", { text })
    writing = []
  }

  for (const node of doc.content ?? []) {
    if (node.type !== "articleMedia") {
      writing.push(node)
      continue
    }
    flushWriting()
    const { kind, url, file_path, file_name, file_type, file_size } = node.attrs ?? {}
    if (kind === "video" && url) append("video", { url })
    if (kind === "file" && file_path) {
      const file = { file_path, file_name, file_type, file_size }
      if (typeof file_type === "string" && file_type.startsWith("video/")) {
        const placement = getVideoPlacement(node.attrs?.placement)
        const widthPercent = getVideoWidthPercent(node.attrs?.widthPercent, placement) ?? (placement === "block" ? MAX_VIDEO_WIDTH_PERCENT : 50)
        append("video", { ...file, placement, widthPercent })
      } else {
        append("file", file)
      }
    }
  }
  flushWriting()
  return blocks
}
