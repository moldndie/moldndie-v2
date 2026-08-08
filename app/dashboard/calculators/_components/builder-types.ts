// Draft model for the calculator builder — the shapes the wizard edits, and the
// conversions to and from what the database stores.
//
// Keys (`field_key`, `output_key`) are machine names the formulas reference.
// The author never types one: they are derived from the label here, and frozen
// once a row has been saved so renaming a label can't break a live formula.

import { hydrate, serialize } from "@/lib/formula-tokens"
import type { CalcField, UnitSystem, UnitMap, FieldType } from "@/types/calculator"

export function uid() { return Math.random().toString(36).slice(2) }

export function makeSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

/** Label → formula-safe identifier. */
export function slugKey(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
}

/** A key that doesn't collide with anything already in use. */
export function uniqueKey(label: string, taken: Set<string>, fallback = "value"): string {
  const base = slugKey(label) || fallback
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}_${n}`)) n++
  return `${base}_${n}`
}

// ── Draft shapes ──────────────────────────────────────────────────────────────

/** Per-system unit; `factor`/`offset` are strings while being typed. */
export type DraftUnits = Record<string, { unit: string; factor: string; offset: string }>

export interface DraftField {
  _uid: string
  id?: string
  label: string
  field_key: string
  field_type: FieldType
  unit: string
  placeholder: string
  help_text: string
  is_required: boolean
  min_value: string
  max_value: string
  step_value: string
  default_value: string
  options_text: string
  field_group: string
  units: DraftUnits
  show_reference: boolean
}

export interface DraftOutput {
  _uid: string
  id?: string
  label: string
  output_key: string
  formula: string
  unit: string
  units: DraftUnits
  decimals: number
  description: string
}

export interface DraftTable {
  _uid: string
  id?: string
  title: string
  category: string
  columns: { id: string; key: string; label: string; unit: string }[]
  rows: { id: string; cells: Record<string, string> }[]
  /** When set, this table is also a dropdown input and feeds the formulas. */
  pickerFieldUid?: string
}

export function emptyField(): DraftField {
  return {
    _uid: uid(), label: "", field_key: "", field_type: "number", unit: "",
    placeholder: "", help_text: "", is_required: true, min_value: "", max_value: "",
    step_value: "", default_value: "", options_text: "", field_group: "",
    units: {}, show_reference: true,
  }
}

export function emptyOutput(): DraftOutput {
  return { _uid: uid(), label: "", output_key: "", formula: "", unit: "", units: {}, decimals: 2, description: "" }
}

// ── Options / presets ─────────────────────────────────────────────────────────

export function parseOptions(text: string): CalcField["options"] {
  if (!text) return null
  try {
    const p = JSON.parse(text)
    return Array.isArray(p) ? p : null
  } catch { return null }
}

/** Variables contributed by preset dropdowns (the `values` map on each option). */
export function presetVarKeys(fields: DraftField[]): string[] {
  const keys = new Set<string>()
  for (const f of fields) {
    if (f.field_type !== "select") continue
    for (const o of parseOptions(f.options_text) ?? []) {
      for (const k of Object.keys(o.values ?? {})) keys.add(k)
    }
  }
  return [...keys]
}

/**
 * Stand-in numbers so the builder can show a real result instead of the old
 * "every variable = 1" check, which called nonsense valid.
 *
 * A select's own key is deliberately absent — it holds a slug, not a number.
 * Its `values` map is what puts usable numbers in scope, exactly as at runtime.
 */
export function sampleValues(fields: DraftField[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const f of fields) {
    if (f.field_type === "select") {
      const opts = parseOptions(f.options_text) ?? []
      const chosen = opts.find((o) => o.value === f.default_value) ?? opts[0]
      for (const [k, v] of Object.entries(chosen?.values ?? {})) out[k] = v
      continue
    }
    if (f.field_type === "checkbox") { out[f.field_key] = 1; continue }
    const fromDefault = parseFloat(f.default_value)
    const fromMin = parseFloat(f.min_value)
    out[f.field_key] = Number.isFinite(fromDefault) ? fromDefault
      : Number.isFinite(fromMin) && fromMin !== 0 ? fromMin
      : 1
  }
  return out
}

/**
 * Rewrite a renamed variable across every formula, at the token level so a key
 * is never matched as a substring of a longer one.
 */
export function renameInFormulas(outputs: DraftOutput[], from: string, to: string): DraftOutput[] {
  if (!from || from === to) return outputs
  return outputs.map((o) => {
    const toks = hydrate(o.formula)
    if (!toks) return o // advanced/raw formula — leave it alone
    let touched = false
    const next = toks.map((t) => {
      if (t.kind === "var" && t.key === from) { touched = true; return { ...t, key: to } }
      return t
    })
    return touched ? { ...o, formula: serialize(next) } : o
  })
}

/** Variables a formula names that nothing provides — the `clamp_force` bug. */
export function missingVars(formula: string, known: Set<string>): string[] {
  const toks = hydrate(formula)
  if (!toks) return []
  return [...new Set(toks.filter((t) => t.kind === "var" && !known.has(t.key)).map((t) => (t as { key: string }).key))]
}

// ── Unit systems ──────────────────────────────────────────────────────────────

export const DEFAULT_UNIT_SYSTEMS: UnitSystem[] = [
  { key: "metric", label: "Metric (cm/kg/s)" },
  { key: "imperial", label: "Imperial (in/lb/s)" },
]

/** Drop half-filled rows: a system with no unit and no factor is just noise. */
export function unitsToDb(u: DraftUnits): UnitMap | null {
  const out: UnitMap = {}
  for (const [key, v] of Object.entries(u)) {
    const factor = parseFloat(v.factor)
    const offset = parseFloat(v.offset)
    if (!v.unit && !Number.isFinite(factor)) continue
    out[key] = {
      unit: v.unit,
      factor: Number.isFinite(factor) && factor !== 0 ? factor : 1,
      ...(Number.isFinite(offset) && offset !== 0 ? { offset } : {}),
    }
  }
  return Object.keys(out).length ? out : null
}

export function unitsToDraft(u: UnitMap | null | undefined): DraftUnits {
  const out: DraftUnits = {}
  for (const [key, v] of Object.entries(u ?? {})) {
    out[key] = { unit: v.unit ?? "", factor: String(v.factor ?? 1), offset: String(v.offset ?? 0) }
  }
  return out
}

// ── Draft → DB ────────────────────────────────────────────────────────────────

export function fieldToDb(f: DraftField) {
  return {
    ...(f.id ? { id: f.id } : {}),
    label: f.label,
    field_key: f.field_key,
    field_type: f.field_type,
    unit: f.unit || null,
    placeholder: f.placeholder || null,
    help_text: f.help_text || null,
    is_required: f.is_required,
    min_value: f.min_value !== "" ? parseFloat(f.min_value) : null,
    max_value: f.max_value !== "" ? parseFloat(f.max_value) : null,
    step_value: f.step_value !== "" ? parseFloat(f.step_value) : null,
    default_value: f.default_value || null,
    options: f.field_type === "select" ? parseOptions(f.options_text) : null,
    field_group: f.field_group || null,
    units: unitsToDb(f.units),
    show_reference: f.show_reference,
    sort_order: 0,
  }
}

export function outputToDb(o: DraftOutput) {
  return {
    ...(o.id ? { id: o.id } : {}),
    label: o.label,
    output_key: o.output_key,
    formula: o.formula,
    unit: o.unit || null,
    units: unitsToDb(o.units),
    decimals: o.decimals,
    description: o.description || null,
    sort_order: 0,
  }
}

export function tableToDb(t: DraftTable) {
  const columns = t.columns
    .filter((c) => c.label.trim())
    .map((c) => ({ key: c.key, label: c.label.trim(), unit: c.unit.trim() || null }))
  return {
    title: t.title.trim() || "Reference Values",
    category: t.category.trim() || null,
    columns,
    rows: t.rows.map((r) => Object.fromEntries(columns.map((c) => [c.key, r.cells[c.key] ?? ""]))),
    sort_order: 0,
  }
}

/**
 * A picker table doubles as a dropdown input: its rows become the choices and
 * its numeric columns become formula variables. Non-numeric cells are skipped —
 * they still show in the published table, they just can't feed a formula.
 */
export function tableToOptionsJson(t: DraftTable): string {
  const [first, ...rest] = t.columns
  if (!first) return ""
  const opts = t.rows.map((r) => {
    const label = r.cells[first.key] ?? ""
    const values: Record<string, number> = {}
    for (const c of rest) {
      const n = parseFloat(r.cells[c.key] ?? "")
      if (Number.isFinite(n)) values[c.key] = n
    }
    return { label, value: slugKey(label) || uid(), values }
  })
  return JSON.stringify(opts)
}

/** The reverse, for tables authored before this editor existed. */
export function optionsToTable(f: DraftField): DraftTable {
  const opts = parseOptions(f.options_text) ?? []
  const valueKeys: string[] = []
  for (const o of opts) {
    for (const k of Object.keys(o.values ?? {})) if (!valueKeys.includes(k)) valueKeys.push(k)
  }
  const first = { id: uid(), key: slugKey(f.label) || "choice", label: f.label || "Choice", unit: "" }
  const columns = [first, ...valueKeys.map((k) => ({ id: uid(), key: k, label: k, unit: "" }))]
  return {
    _uid: uid(),
    title: f.label || "Reference Values",
    category: "",
    columns,
    rows: opts.map((o) => ({
      id: uid(),
      cells: {
        [first.key]: o.label,
        ...Object.fromEntries(valueKeys.map((k) => [k, o.values?.[k] != null ? String(o.values[k]) : ""])),
      },
    })),
    pickerFieldUid: f._uid,
  }
}

// ── Ready-made inputs ─────────────────────────────────────────────────────────

/**
 * The two options-with-values dropdowns every calculator seems to want. They are
 * ordinary select fields, just saved from being rebuilt by hand each time.
 */
export const FIELD_TEMPLATES: { key: string; label: string; build: () => Partial<DraftField> }[] = [
  {
    key: "method",
    label: "Calculation Method",
    build: () => ({
      label: "Calculation Method", field_key: "method", field_type: "select",
      is_required: false, show_reference: false,
      options_text: JSON.stringify([
        { label: "Standard", value: "standard", values: { method: 1 } },
        { label: "Conservative", value: "conservative", values: { method: 1.2 } },
      ]),
      help_text: "Each choice sets a number your formulas can use.",
    }),
  },
  {
    key: "safety",
    label: "Safety Factor",
    build: () => ({
      label: "Safety Factor", field_key: "safety_factor", field_type: "select",
      is_required: false, show_reference: false,
      options_text: JSON.stringify([
        { label: "None (1.0)", value: "none", values: { safety_factor: 1 } },
        { label: "Light (1.1)", value: "light", values: { safety_factor: 1.1 } },
        { label: "Standard (1.25)", value: "standard", values: { safety_factor: 1.25 } },
      ]),
      help_text: "Each choice sets a number your formulas can use.",
    }),
  },
]
