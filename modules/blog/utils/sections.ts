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
    case "file":      return { file_path: "", file_name: "", file_type: "" }
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
// Groups a *run* of consecutive two-column blocks into one two-column Section,
// partitioning the run into independent left/right stacks. The region width
// ratio is read from the first block in the run (default 50). Every other block
// becomes a full-width Section. This is backward compatible with the old strict
// left/right pairing: L,R,L,R groups into left:[L,L] / right:[R,R].

export const DEFAULT_COLUMN_RATIO = 50

export function blocksToSections(blocks: EditorBlock[]): Section[] {
  const sections: Section[] = []
  let i = 0

  while (i < blocks.length) {
    const block = blocks[i]

    if (block.layout === "two-column") {
      // Consume the whole run of consecutive two-column blocks.
      const run: EditorBlock[] = []
      while (i < blocks.length && blocks[i].layout === "two-column") {
        run.push(blocks[i])
        i++
      }
      sections.push({
        id: `sec-${run[0].id}`,
        type: "two-column",
        left: run.filter((b) => b.column_position !== "right"),
        right: run.filter((b) => b.column_position === "right"),
        ratio: run[0].column_ratio ?? DEFAULT_COLUMN_RATIO,
      })
      continue
    }

    sections.push({
      id: `sec-${block.id}`,
      type: "full-width",
      block,
    })
    i++
  }

  return sections
}

// ─── Sections → Flat blocks ───────────────────────────────────────────────────
// Expands sections back into the flat block array expected by the DB. Two-column
// regions emit all left blocks then all right blocks contiguously (so they read
// back as one run), each stamped with the region ratio. order_index is assigned
// later by array position in the caller.

export function sectionsToBlocks(sections: Section[]): EditorBlock[] {
  const blocks: EditorBlock[] = []

  for (const section of sections) {
    if (section.type === "full-width") {
      blocks.push({ ...section.block, layout: null, column_position: null, column_ratio: null })
    } else {
      for (const b of section.left) {
        blocks.push({ ...b, layout: "two-column", column_position: "left", column_ratio: section.ratio })
      }
      for (const b of section.right) {
        blocks.push({ ...b, layout: "two-column", column_position: "right", column_ratio: section.ratio })
      }
    }
  }

  return blocks
}
