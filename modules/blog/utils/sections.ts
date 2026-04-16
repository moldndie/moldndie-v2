import type { BlockType } from "@/types/blog"
import type { EditorBlock, Section } from "../types"

// ─── Default content per block type ──────────────────────────────────────────

export function getDefaultContent(block_type: BlockType): Record<string, unknown> {
  switch (block_type) {
    case "heading":   return { text: "", level: 2 }
    case "paragraph": return { text: "" }
    case "image":     return { url: "", caption: "" }
    case "quote":     return { text: "", author: "" }
    case "list":      return { items: [""] }
    case "video":     return { url: "" }
  }
}

export function makeBlock(block_type: BlockType): EditorBlock {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    block_type,
    content: getDefaultContent(block_type),
  }
}

// ─── Flat blocks → Sections ───────────────────────────────────────────────────
// Pairs consecutive left+right two-column blocks into a single Section.
// Everything else becomes a full-width Section.

export function blocksToSections(blocks: EditorBlock[]): Section[] {
  const sections: Section[] = []
  let i = 0

  while (i < blocks.length) {
    const block = blocks[i]

    if (block.layout === "two-column" && block.column_position === "left") {
      const next = blocks[i + 1]
      if (next?.layout === "two-column" && next.column_position === "right") {
        sections.push({
          id: `sec-${block.id}`,
          type: "two-column",
          left: block,
          right: next,
        })
        i += 2
        continue
      }
      // Orphaned left block — demote to full-width
      sections.push({
        id: `sec-${block.id}`,
        type: "full-width",
        block: { ...block, layout: null, column_position: null },
      })
    } else {
      sections.push({
        id: `sec-${block.id}`,
        type: "full-width",
        block: block,
      })
    }
    i++
  }

  return sections
}

// ─── Sections → Flat blocks ───────────────────────────────────────────────────
// Expands sections back into the flat block array expected by the DB.
// order_index is assigned by position in the array.

export function sectionsToBlocks(sections: Section[]): EditorBlock[] {
  const blocks: EditorBlock[] = []

  for (const section of sections) {
    if (section.type === "full-width" && section.block) {
      blocks.push({ ...section.block, layout: null, column_position: null })
    } else if (section.type === "two-column") {
      if (section.left) {
        blocks.push({ ...section.left, layout: "two-column", column_position: "left" })
      }
      if (section.right) {
        blocks.push({ ...section.right, layout: "two-column", column_position: "right" })
      }
    }
  }

  return blocks
}
