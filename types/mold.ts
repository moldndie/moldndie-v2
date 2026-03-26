export interface MoldCategory {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface MoldGalleryItem {
  id: string
  mold_id: string
  file_key: string
  type: "image" | "video"
  position: number
}

export interface Mold {
  id: string
  title: string
  description: string | null
  category_id: string | null
  price: number | null
  preview_image: string | null
  file_key: string | null
  created_at: string
  category?: MoldCategory | null
  gallery?: MoldGalleryItem[]
}
