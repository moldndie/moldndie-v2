import type { BlockType } from "@/types/blog"

export interface EditorBlock {
  id: string
  block_type: BlockType
  content: Record<string, unknown>
  layout?: "single" | "two-column" | null
  column_position?: "left" | "right" | "full" | null
}
