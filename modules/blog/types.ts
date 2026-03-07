import type { BlockType } from "@/types/blog"

export interface EditorBlock {
  id: string
  type: BlockType
  content: Record<string, unknown>
}
