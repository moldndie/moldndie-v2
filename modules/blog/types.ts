import type { BlockType } from "@/types/blog"

export interface EditorBlock {
  id: string
  block_type: BlockType
  content: Record<string, unknown>
}
