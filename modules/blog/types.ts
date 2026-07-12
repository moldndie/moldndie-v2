import type { BlockType } from "@/types/blog"

export interface EditorBlock {
  id: string
  block_type: BlockType
  content: Record<string, unknown>
  layout?: "single" | "two-column" | null
  column_position?: "left" | "right" | "full" | null
  column_ratio?: number | null   // left column width %, region-level (default 50)
}

// A section is either a single full-width block, or a two-column region with
// two independent, continuously-flowing stacks (left + right) and a width ratio.
export type Section =
  | { id: string; type: "full-width"; block: EditorBlock }
  | { id: string; type: "two-column"; left: EditorBlock[]; right: EditorBlock[]; ratio: number }
