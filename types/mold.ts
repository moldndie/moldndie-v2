export interface MoldCategory {
  id: string
  name: string
  slug: string
}

export interface MoldImage {
  id: string
  mold_id: string
  image_url: string
}

export interface Mold {
  id: string
  title: string
  description: string | null
  category_id: string | null
  price: number | null
  preview_image: string | null
  download_url: string | null
  created_at: string
  category?: MoldCategory | null
  images?: MoldImage[]
}
