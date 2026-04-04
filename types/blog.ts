import type { Profile } from "./profile"

export type BlockType = "heading" | "paragraph" | "image" | "quote" | "list" | "video"

export interface BlogCategory {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface BlogBlock {
  id: string
  blog_id: string
  block_type: BlockType
  content: Record<string, unknown>
  order_index: number
  layout?: "single" | "two-column" | null
  column_position?: "left" | "right" | "full" | null
  created_at: string
}

export interface Blog {
  id: string
  title: string
  slug: string
  introduction: string | null
  cover_image_path: string | null
  author_id: string | null
  created_by: string | null
  category_id: string | null
  is_published: boolean
  created_at: string
  category?: BlogCategory | null
  author?: Profile | null
  tags?: BlogTag[]
  blocks?: BlogBlock[]
}
