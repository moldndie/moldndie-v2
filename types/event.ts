export interface EventCategory {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Event {
  id: string
  title: string
  description: string | null
  image_path: string | null
  event_date: string | null
  category_id: string | null
  country: string | null
  address: string | null
  website: string | null
  created_at: string
  category?: EventCategory | null
}
