export type FieldType = "number" | "text" | "select" | "checkbox" | "range"

export interface CalcCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Calculator {
  id: string
  category_id: string | null
  title: string
  slug: string
  short_description: string | null
  description: string | null
  icon: string | null
  cover_image: string | null
  is_featured: boolean
  is_published: boolean
  sort_order: number
  seo_title: string | null
  seo_description: string | null
  views_count: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CalculatorWithRelations extends Calculator {
  category: CalcCategory | null
  fields: CalcField[]
  outputs: CalcOutput[]
}

export interface CalcField {
  id: string
  calculator_id: string
  label: string
  field_key: string
  field_type: FieldType
  unit: string | null
  placeholder: string | null
  help_text: string | null
  is_required: boolean
  min_value: number | null
  max_value: number | null
  step_value: number | null
  default_value: string | null
  options: Array<{ label: string; value: string }> | null
  sort_order: number
  created_at: string
}

export interface CalcOutput {
  id: string
  calculator_id: string
  label: string
  output_key: string
  formula: string
  unit: string | null
  decimals: number
  description: string | null
  sort_order: number
  created_at: string
}

export interface CalcRun {
  id: string
  calculator_id: string
  user_id: string | null
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}
