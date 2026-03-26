export type AdTargetType = "blog" | "mold" | "event" | "supplier" | "external"

export interface Ad {
  id: string
  title: string
  image_path: string
  target_type: AdTargetType
  link: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
  created_at: string
}
