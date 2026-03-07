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
  type: BlockType
  content: Record<string, unknown>
  position: number
  created_at: string
}

export interface Blog {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image: string | null
  author_id: string | null
  category_id: string | null
  published: boolean
  created_at: string
  category?: BlogCategory | null
  author?: Profile | null
  tags?: BlogTag[]
  blocks?: BlogBlock[]
}
