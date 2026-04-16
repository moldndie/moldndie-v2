import type { BlockType } from "@/types/blog"

export interface EditorBlock {
  id: string
  block_type: BlockType
  content: Record<string, unknown>
  layout?: "single" | "two-column" | null
  column_position?: "left" | "right" | "full" | null
}

export interface Section {
  id: string
  type: "full-width" | "two-column"
  block?: EditorBlock   // full-width sections
  left?: EditorBlock    // two-column sections
  right?: EditorBlock   // two-column sections
}
