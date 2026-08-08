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

/** One entry of a calculator's unit switcher. */
export interface UnitSystem {
  key: string
  label: string
}

/**
 * Per-system unit label + conversion, keyed by `UnitSystem["key"]`.
 * `display = base × factor + offset` — formulas are always authored in the base
 * (factor 1, offset 0) system. `offset` is only ever non-zero for temperature.
 */
export type UnitMap = Record<string, { unit: string; factor: number; offset?: number }>

export interface Calculator {
  id: string
  category_id: string | null
  title: string
  slug: string
  short_description: string | null
  description: string | null
  icon: string | null
  cover_image: string | null
  /** Extra images; falls back to `cover_image` when empty. */
  images: string[]
  /** null / empty = no unit switcher on this calculator. */
  unit_systems: UnitSystem[] | null
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
  referenceTables: CalcReferenceTable[]
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
  // For `select` fields. An option may carry a `values` map so that picking it
  // injects those variables into the formula scope (a "material preset" lookup),
  // e.g. { label: "ABS", value: "abs", values: { alpha: 0.069, melt_temp: 220 } }.
  options: Array<{ label: string; value: string; values?: Record<string, number> }> | null
  units: UnitMap | null
  /** Preset dropdowns render a reference table unless this is off. */
  show_reference: boolean
  // Optional heading used to group inputs into sections on the public page.
  field_group: string | null
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
  units: UnitMap | null
  decimals: number
  description: string | null
  sort_order: number
  created_at: string
}

export interface CalcReferenceColumn {
  key: string
  label: string
  unit?: string | null
}

export interface CalcReferenceTable {
  id: string
  calculator_id: string
  title: string
  category: string | null
  columns: CalcReferenceColumn[]
  rows: Record<string, string>[]
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
