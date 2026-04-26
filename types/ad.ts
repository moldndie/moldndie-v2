export type AdTargetType = "blog" | "mold" | "event" | "supplier" | "course" | "global" | "external"

export interface Ad {
  id: string
  title: string
  image_path: string
  link: string
  target_type: AdTargetType
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}
