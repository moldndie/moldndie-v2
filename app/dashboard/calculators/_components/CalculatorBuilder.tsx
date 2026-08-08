"use client"

import { useState, useTransition, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Plus, Trash2, ChevronUp, ChevronDown, Info, Zap, Settings,
  FlaskConical, HelpCircle, CheckCircle2, ArrowLeft, ArrowRight,
  Eye, Check, AlertTriangle, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toDoc, fromDoc } from "@/lib/richtext"
import { Textarea } from "@/components/ui/textarea"
import RichTextEditor from "@/components/editor/RichTextEditor"
import { CroppableFileUploadField } from "@/components/forms/CroppableFileUploadField"
import { FilePreview } from "@/components/forms/FilePreview"
import type {
  CalcCategory, CalculatorWithRelations, CalcField, CalcOutput, FieldType,
  UnitSystem, UnitMap,
} from "@/types/calculator"
import { saveFullCalculator } from "@/services/calculator.service"
import { evaluateFormula } from "@/lib/formula-engine"
import CalculatorRunner from "@/app/tools/[slug]/CalculatorRunner"

function makeSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}
function optSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "opt"
}

// ── Draft types (local state only) ────────────────────────────────────────────

interface DraftField {
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
  /** Per-system unit + factor, factor kept as a string while being typed. */
  units: DraftUnits
  show_reference: boolean
}

/** Keyed by unit-system key. */
type DraftUnits = Record<string, { unit: string; factor: string }>

interface DraftTable {
  _uid: string
  id?: string
  title: string
  category: string
  columns: { id: string; key: string; label: string; unit: string }[]
  rows: { id: string; cells: Record<string, string> }[]
}

interface DraftOutput {
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

// ── Templates ─────────────────────────────────────────────────────────────────

const TEMPLATES: Record<string, { title: string; description: string; fields: Partial<DraftField>[]; outputs: Partial<DraftOutput>[] }> = {
  circle_area: {
    title: "Area of Circle",
    description: "Calculate the area of a circle given its radius.",
    fields: [{ label: "Radius", field_key: "radius", field_type: "number", unit: "cm", is_required: true }],
    outputs: [{ label: "Area", output_key: "area", formula: "pi * radius * radius", unit: "cm²", decimals: 2 }],
  },
  rectangle_area: {
    title: "Rectangle Area",
    description: "Calculate the area of a rectangle.",
    fields: [
      { label: "Length", field_key: "length", field_type: "number", unit: "cm", is_required: true },
      { label: "Width", field_key: "width", field_type: "number", unit: "cm", is_required: true },
    ],
    outputs: [{ label: "Area", output_key: "area", formula: "length * width", unit: "cm²", decimals: 2 }],
  },
  cylinder_volume: {
    title: "Cylinder Volume",
    description: "Calculate the volume of a cylinder.",
    fields: [
      { label: "Radius", field_key: "radius", field_type: "number", unit: "cm", is_required: true },
      { label: "Height", field_key: "height", field_type: "number", unit: "cm", is_required: true },
    ],
    outputs: [{ label: "Volume", output_key: "volume", formula: "pi * radius * radius * height", unit: "cm³", decimals: 2 }],
  },
  percentage_increase: {
    title: "Percentage Increase",
    description: "Calculate the percentage increase between two values.",
    fields: [
      { label: "Original Value", field_key: "original", field_type: "number", is_required: true },
      { label: "New Value", field_key: "new_value", field_type: "number", is_required: true },
    ],
    outputs: [{ label: "Increase", output_key: "increase", formula: "((new_value - original) / original) * 100", unit: "%", decimals: 2 }],
  },
  clamp_force: {
    title: "Clamp Force Calculator",
    description: "Estimate required clamping force for injection molding.",
    fields: [
      { label: "Projected Area", field_key: "projected_area", field_type: "number", unit: "cm²", is_required: true, placeholder: "e.g. 120" },
      { label: "Cavity Pressure", field_key: "pressure", field_type: "number", unit: "MPa", is_required: true, placeholder: "e.g. 350" },
    ],
    outputs: [{ label: "Clamp Force", output_key: "clamp_force", formula: "(projected_area * pressure) / 1000", unit: "kN", decimals: 1 }],
  },
  shrinkage: {
    title: "Shrinkage Calculator",
    description: "Calculate mold shrinkage rate from mold and part dimensions.",
    fields: [
      { label: "Mold Dimension", field_key: "mold_dim", field_type: "number", unit: "mm", is_required: true },
      { label: "Part Dimension", field_key: "part_dim", field_type: "number", unit: "mm", is_required: true },
    ],
    outputs: [{ label: "Shrinkage Rate", output_key: "shrinkage_rate", formula: "((mold_dim - part_dim) / mold_dim) * 100", unit: "%", decimals: 3 }],
  },
  cycle_time: {
    title: "Injection Molding Cycle Time",
    description: "Estimate total injection molding cycle time — mold open/close, injection, holding and cooling — from part geometry and the selected material's thermal properties.",
    fields: [
      {
        label: "Material", field_key: "material", field_type: "select", field_group: "Material Selection",
        is_required: true, default_value: "abs", help_text: "Auto-fills thermal diffusivity, melt/mold temperature and heat-deflection temperature.",
        options_text: JSON.stringify([
          { label: "ABS",    value: "abs",    values: { alpha: 0.080, melt_temp: 220,   mold_temp: 45,   hdt: 85 } },
          { label: "HIPS",   value: "hips",   values: { alpha: 0.080, melt_temp: 220,   mold_temp: 45,   hdt: 85 } },
          { label: "PS",     value: "ps",     values: { alpha: 0.080, melt_temp: 220,   mold_temp: 55,   hdt: 85 } },
          { label: "PP",     value: "pp",     values: { alpha: 0.065, melt_temp: 230,   mold_temp: 37.5, hdt: 85 } },
          { label: "HDPE",   value: "hdpe",   values: { alpha: 0.090, melt_temp: 225,   mold_temp: 32.5, hdt: 50 } },
          { label: "LDPE",   value: "ldpe",   values: { alpha: 0.090, melt_temp: 225,   mold_temp: 32.5, hdt: 50 } },
          { label: "PMMA",   value: "pmma",   values: { alpha: 0.075, melt_temp: 220,   mold_temp: 55,   hdt: 90 } },
          { label: "POM",    value: "pom",    values: { alpha: 0.060, melt_temp: 220,   mold_temp: 57.5, hdt: 115 } },
          { label: "PA6",    value: "pa6",    values: { alpha: 0.070, melt_temp: 237.5, mold_temp: 90,   hdt: 130 } },
          { label: "PA66",   value: "pa66",   values: { alpha: 0.085, melt_temp: 282.5, mold_temp: 90,   hdt: 150 } },
          { label: "PBT",    value: "pbt",    values: { alpha: 0.090, melt_temp: 245,   mold_temp: 100,  hdt: 150 } },
          { label: "PET",    value: "pet",    values: { alpha: 0.090, melt_temp: 275,   mold_temp: 100,  hdt: 150 } },
          { label: "PC",     value: "pc",     values: { alpha: 0.105, melt_temp: 290,   mold_temp: 85,   hdt: 130 } },
          { label: "PC-ABS", value: "pc_abs", values: { alpha: 0.095, melt_temp: 250,   mold_temp: 65,   hdt: 110 } },
        ]),
      },
      { label: "Clamping Force", field_key: "clamp_force", field_type: "number", unit: "tons", is_required: true, default_value: "100", field_group: "Part & Machine", placeholder: "e.g. 100" },
      { label: "Product Weight", field_key: "weight", field_type: "number", unit: "g", is_required: true, default_value: "50", field_group: "Part & Machine", placeholder: "e.g. 50" },
      { label: "Max Wall Thickness", field_key: "wall", field_type: "number", unit: "mm", is_required: true, default_value: "2", field_group: "Part & Machine", placeholder: "e.g. 2", help_text: "Thickest wall section of the part." },
    ],
    outputs: [
      { label: "Mold Open/Close Time (T₀)", output_key: "t0", formula: "0.013 * clamp_force + 3.6", unit: "s", decimals: 2, description: "Machine dry-cycle time, scaled by clamping force." },
      { label: "Injection Time (Tᵢ)",       output_key: "ti", formula: "0.0085 * weight + 0.5",     unit: "s", decimals: 2, description: "Fill time, scaled by shot weight." },
      { label: "Holding Time (Tₕ)",         output_key: "th", formula: "0.6 * wall^2 + 0.3 * wall",  unit: "s", decimals: 2, description: "Pack/hold time, scaled by wall thickness." },
      { label: "Cooling Time (Tᶜ)",         output_key: "tc", formula: "wall^2 / (alpha * pi^2) * log(8 / pi^2 * (melt_temp - mold_temp) / (hdt - mold_temp))", unit: "s", decimals: 2, description: "Heat-diffusion cooling time from material properties." },
      { label: "Total Cycle Time",          output_key: "total", formula: "t0 + ti + th + tc",       unit: "s", decimals: 2, description: "Sum of all four phases." },
    ],
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2) }

function parseOptions(text: string): CalcField["options"] {
  if (!text) return null
  try {
    const p = JSON.parse(text)
    return Array.isArray(p) ? p : null
  } catch { return null }
}

// Variable keys contributed by material-preset dropdowns (the `values` maps on
// select options), used to validate formulas in the live preview.
function presetVarKeys(fields: DraftField[]): string[] {
  const keys = new Set<string>()
  for (const f of fields) {
    if (f.field_type !== "select") continue
    for (const o of parseOptions(f.options_text) ?? []) {
      for (const k of Object.keys(o.values ?? {})) keys.add(k)
    }
  }
  return [...keys]
}

function emptyField(): DraftField {
  return { _uid: uid(), label: "", field_key: "", field_type: "number", unit: "", placeholder: "", help_text: "", is_required: true, min_value: "", max_value: "", step_value: "", default_value: "", options_text: "", field_group: "", units: {}, show_reference: true }
}

function emptyOutput(): DraftOutput {
  return { _uid: uid(), label: "", output_key: "", formula: "", unit: "", decimals: 2, units: {}, description: "" }
}

/**
 * Prefilled inputs for the two options-with-values dropdowns every calculator
 * seems to want. They are ordinary select fields — picking a choice injects its
 * value into the formula scope — just saved from being retyped each time.
 * `show_reference` is off so they don't publish themselves as reference tables.
 */
const FIELD_TEMPLATES: { key: string; label: string; build: () => Partial<DraftField> }[] = [
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
      help_text: "Each choice sets the `method` variable you can use in formulas.",
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
      help_text: "Each choice sets the `safety_factor` variable you can use in formulas.",
    }),
  },
]

/** The two the client asked for; labels are editable afterwards. */
const DEFAULT_UNIT_SYSTEMS: UnitSystem[] = [
  { key: "metric", label: "Metric (cm/kg/s)" },
  { key: "imperial", label: "Imperial (in/lb/s)" },
]

/** Drop half-filled rows: a system with no unit and no factor is just noise. */
function unitsToDb(u: DraftUnits): UnitMap | null {
  const out: UnitMap = {}
  for (const [key, v] of Object.entries(u)) {
    const factor = parseFloat(v.factor)
    if (!v.unit && !Number.isFinite(factor)) continue
    out[key] = { unit: v.unit, factor: Number.isFinite(factor) && factor !== 0 ? factor : 1 }
  }
  return Object.keys(out).length ? out : null
}

function unitsToDraft(u: UnitMap | null | undefined): DraftUnits {
  const out: DraftUnits = {}
  for (const [key, v] of Object.entries(u ?? {})) out[key] = { unit: v.unit ?? "", factor: String(v.factor ?? 1) }
  return out
}

function tableToDb(t: DraftTable) {
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

function fieldToDb(f: DraftField) {
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

function outputToDb(o: DraftOutput) {
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

// ── Leaf UI ──────────────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-zinc-700 mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition",
        props.className,
      )}
    />
  )
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white",
        props.className,
      )}
    >
      {children}
    </select>
  )
}

function ReorderBtns({ idx, total, onMove }: { idx: number; total: number; onMove: (d: 1 | -1) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <button type="button" onClick={() => onMove(-1)} disabled={idx === 0} className="rounded p-0.5 text-zinc-400 hover:text-zinc-700 disabled:opacity-20 hover:bg-zinc-100">
        <ChevronUp className="size-3.5" />
      </button>
      <button type="button" onClick={() => onMove(1)} disabled={idx === total - 1} className="rounded p-0.5 text-zinc-400 hover:text-zinc-700 disabled:opacity-20 hover:bg-zinc-100">
        <ChevronDown className="size-3.5" />
      </button>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props {
  calculator?: CalculatorWithRelations
  categories: CalcCategory[]
}

const STEP_META = [
  { label: "Details", icon: Settings },
  { label: "Inputs", icon: FlaskConical },
  { label: "Formulas", icon: Zap },
  { label: "Review", icon: CheckCircle2 },
] as const

export default function CalculatorBuilder({ calculator, categories }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(0)
  const [showTemplates, setShowTemplates] = useState(!calculator)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Close the preview drawer on Escape.
  useEffect(() => {
    if (!previewOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPreviewOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [previewOpen])

  // Basic info state
  const [title, setTitle] = useState(calculator?.title ?? "")
  const [slug, setSlug] = useState(calculator?.slug ?? "")
  const [slugManual, setSlugManual] = useState(!!calculator)
  const [shortDesc, setShortDesc] = useState(calculator?.short_description ?? "")
  const [description, setDescription] = useState(calculator?.description ?? "")
  // `cover_image` is the legacy single slot; anything saved since is in `images`.
  const [images, setImages] = useState<string[]>(() =>
    calculator?.images?.length ? calculator.images : calculator?.cover_image ? [calculator.cover_image] : []
  )
  const [unitSystems, setUnitSystems] = useState<UnitSystem[]>(calculator?.unit_systems ?? [])
  const [categoryId, setCategoryId] = useState(calculator?.category_id ?? "")
  const [isFeatured, setIsFeatured] = useState(calculator?.is_featured ?? false)
  const [isPublished, setIsPublished] = useState(calculator?.is_published ?? false)
  const [sortOrder, setSortOrder] = useState(String(calculator?.sort_order ?? 0))
  const [seoTitle, setSeoTitle] = useState(calculator?.seo_title ?? "")
  const [seoDesc, setSeoDesc] = useState(calculator?.seo_description ?? "")

  // Fields state
  const [fields, setFields] = useState<DraftField[]>(() =>
    calculator?.fields.map((f) => ({
      _uid: uid(), id: f.id, label: f.label, field_key: f.field_key,
      field_type: f.field_type, unit: f.unit ?? "", placeholder: f.placeholder ?? "",
      help_text: f.help_text ?? "", is_required: f.is_required,
      min_value: f.min_value != null ? String(f.min_value) : "",
      max_value: f.max_value != null ? String(f.max_value) : "",
      step_value: f.step_value != null ? String(f.step_value) : "",
      default_value: f.default_value ?? "",
      options_text: f.options ? JSON.stringify(f.options) : "",
      field_group: f.field_group ?? "",
      units: unitsToDraft(f.units),
      show_reference: f.show_reference ?? true,
    })) ?? []
  )

  // Outputs state
  const [outputs, setOutputs] = useState<DraftOutput[]>(() =>
    calculator?.outputs.map((o) => ({
      _uid: uid(), id: o.id, label: o.label, output_key: o.output_key,
      formula: o.formula, unit: o.unit ?? "", decimals: o.decimals,
      units: unitsToDraft(o.units),
      description: o.description ?? "",
    })) ?? []
  )

  // Reference tables state
  const [tables, setTables] = useState<DraftTable[]>(() =>
    calculator?.referenceTables?.map((t) => {
      const columns = (t.columns ?? []).map((c) => ({ id: uid(), key: c.key, label: c.label, unit: c.unit ?? "" }))
      return {
        _uid: uid(), id: t.id, title: t.title, category: t.category ?? "", columns,
        rows: (t.rows ?? []).map((r) => ({ id: uid(), cells: { ...r } })),
      }
    }) ?? []
  )

  // ── title → slug auto-derive ──────────────────────────────────────────────
  function handleTitleChange(v: string) {
    setTitle(v)
    if (!slugManual) setSlug(makeSlug(v))
  }

  // ── Template apply ─────────────────────────────────────────────────────────
  function applyTemplate(key: string) {
    const tpl = TEMPLATES[key]
    if (!tpl) return
    setTitle(tpl.title)
    setSlug(makeSlug(tpl.title))
    setShortDesc(tpl.description)
    setFields(tpl.fields.map((f) => ({ ...emptyField(), ...f, _uid: uid() })))
    setOutputs(tpl.outputs.map((o) => ({ ...emptyOutput(), ...o, _uid: uid() })))
    setShowTemplates(false)
    setStep(1)
    toast.success(`Template "${tpl.title}" applied`)
  }

  // ── Field helpers ──────────────────────────────────────────────────────────
  const addField = useCallback(() => setFields((p) => [...p, emptyField()]), [])
  const addTemplateField = useCallback(
    (patch: Partial<DraftField>) => setFields((p) => [...p, { ...emptyField(), ...patch }]),
    [],
  )
  const removeField = useCallback((uid: string) => setFields((p) => p.filter((f) => f._uid !== uid)), [])
  const updateField = useCallback(<K extends keyof DraftField>(uid: string, key: K, val: DraftField[K]) => {
    setFields((p) => p.map((f) => f._uid === uid ? { ...f, [key]: val } : f))
  }, [])
  const moveField = useCallback((idx: number, dir: 1 | -1) => {
    setFields((p) => {
      const a = [...p]; [a[idx], a[idx + dir]] = [a[idx + dir], a[idx]]; return a
    })
  }, [])

  // ── Output helpers ─────────────────────────────────────────────────────────
  const addOutput = useCallback(() => setOutputs((p) => [...p, emptyOutput()]), [])
  const removeOutput = useCallback((uid: string) => setOutputs((p) => p.filter((o) => o._uid !== uid)), [])
  const updateOutput = useCallback(<K extends keyof DraftOutput>(uid: string, key: K, val: DraftOutput[K]) => {
    setOutputs((p) => p.map((o) => o._uid === uid ? { ...o, [key]: val } : o))
  }, [])
  const moveOutput = useCallback((idx: number, dir: 1 | -1) => {
    setOutputs((p) => {
      const a = [...p]; [a[idx], a[idx + dir]] = [a[idx + dir], a[idx]]; return a
    })
  }, [])

  // ── Derived: known formula variables & validation ──────────────────────────
  const knownVars = useMemo(() => [
    ...fields.map((f) => f.field_key).filter(Boolean),
    ...presetVarKeys(fields),
    ...outputs.map((o) => o.output_key).filter(Boolean),
  ], [fields, outputs])

  const issues = useMemo(() => {
    const list: string[] = []
    if (!title.trim()) list.push("Add a title (Details step)")
    if (!slug.trim()) list.push("Add a URL slug (Details step)")
    if (fields.length === 0) list.push("Add at least one input field")
    fields.forEach((f, i) => {
      if (!f.label.trim() || !f.field_key.trim()) list.push(`Input ${i + 1} needs a label and key`)
    })
    if (outputs.length === 0) list.push("Add at least one output")
    const testVars = Object.fromEntries(knownVars.map((k) => [k, 1]))
    outputs.forEach((o, i) => {
      if (!o.label.trim() || !o.formula.trim()) { list.push(`Output ${i + 1} needs a label and formula`); return }
      const r = evaluateFormula(o.formula, testVars)
      if ("error" in r) list.push(`Output "${o.label || i + 1}" formula: ${r.error}`)
    })
    return list
  }, [title, slug, fields, outputs, knownVars])

  // ── Live preview model ─────────────────────────────────────────────────────
  const previewCalc = useMemo<CalculatorWithRelations>(() => ({
    id: "preview", category_id: null,
    title: title || "Untitled Engineering Tool", slug: slug || "preview",
    short_description: shortDesc || null, description: null, icon: null, cover_image: null,
    images: [], unit_systems: unitSystems.length ? unitSystems : null,
    is_featured: false, is_published: true, sort_order: 0, seo_title: null, seo_description: null,
    views_count: 0, created_by: null, created_at: "", updated_at: "", category: null,
    fields: fields.map((f, i): CalcField => ({
      id: f._uid, calculator_id: "preview",
      label: f.label || "Untitled field", field_key: f.field_key || `field_${i + 1}`,
      field_type: f.field_type, unit: f.unit || null, placeholder: f.placeholder || null,
      help_text: f.help_text || null, is_required: f.is_required,
      min_value: f.min_value !== "" ? parseFloat(f.min_value) : null,
      max_value: f.max_value !== "" ? parseFloat(f.max_value) : null,
      step_value: f.step_value !== "" ? parseFloat(f.step_value) : null,
      default_value: f.default_value || null,
      options: parseOptions(f.options_text),
      units: unitsToDb(f.units), show_reference: f.show_reference,
      field_group: f.field_group || null, sort_order: i, created_at: "",
    })),
    outputs: outputs.map((o, i): CalcOutput => ({
      id: o._uid, calculator_id: "preview",
      label: o.label || "Untitled output", output_key: o.output_key || `out_${i + 1}`,
      formula: o.formula, unit: o.unit || null, decimals: o.decimals,
      units: unitsToDb(o.units),
      description: o.description || null, sort_order: i, created_at: "",
    })),
    referenceTables: tables.map((t, i) => ({
      id: t._uid, calculator_id: "preview", ...tableToDb(t), sort_order: i, created_at: "",
    })),
  }), [title, slug, shortDesc, fields, outputs, tables, unitSystems])

  // Remount the preview only when structure/formulas/defaults change (not while
  // typing values into the preview itself), so defaults re-initialise cleanly.
  const previewKey = useMemo(() =>
    fields.map((f) => `${f.field_key}|${f.field_type}|${f.default_value}|${f.options_text}`).join("~")
    + "#" + outputs.map((o) => `${o.output_key}=${o.formula}|${o.decimals}`).join("~")
    + "#" + unitSystems.map((u) => u.key).join(","),
    [fields, outputs, unitSystems])

  // ── Save ───────────────────────────────────────────────────────────────────
  function handleSave() {
    if (!title.trim()) { toast.error("Title is required"); setStep(0); return }
    if (!slug.trim()) { toast.error("Slug is required"); setStep(0); return }

    startTransition(async () => {
      try {
        const saved = await saveFullCalculator({
          basic: {
            ...(calculator?.id ? { id: calculator.id } : {}),
            title: title.trim(),
            slug: slug.trim(),
            short_description: shortDesc || null,
            description: description || null,
            cover_image: images[0] ?? null,
            images,
            unit_systems: unitSystems.length ? unitSystems : null,
            category_id: categoryId || null,
            is_featured: isFeatured,
            is_published: isPublished,
            sort_order: parseInt(sortOrder) || 0,
            seo_title: seoTitle || null,
            seo_description: seoDesc || null,
          },
          fields: fields.map(fieldToDb),
          outputs: outputs.map(outputToDb),
          referenceTables: tables.map(tableToDb),
        })
        toast.success(calculator ? "Engineering tool updated" : "Engineering tool created")
        if (!calculator) router.push(`/dashboard/calculators/${saved.id}/edit`)
      } catch (e) {
        toast.error((e as Error).message || "Save failed")
      }
    })
  }

  const isLast = step === STEP_META.length - 1

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <Stepper current={step} counts={[undefined, fields.length, outputs.length, undefined]} onGo={setStep} />

      <div>
        <div className="min-w-0 space-y-5">
          {/* Template chooser (step 1, new only) */}
          {step === 0 && showTemplates && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="size-4 text-primary" />
                  <p className="text-sm font-semibold text-zinc-900">Start from a template (optional)</p>
                </div>
                <button onClick={() => setShowTemplates(false)} className="text-xs text-zinc-400 hover:text-zinc-600">Dismiss</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(TEMPLATES).map(([key, tpl]) => (
                  <button
                    key={key}
                    onClick={() => applyTemplate(key)}
                    className="text-left rounded-lg border border-zinc-200 bg-white p-3 hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <p className="text-sm font-medium text-zinc-900">{tpl.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{tpl.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 0 && (
            <StepDetails
              title={title} onTitle={handleTitleChange}
              slug={slug} onSlug={(v) => { setSlug(v); setSlugManual(true) }}
              shortDesc={shortDesc} onShortDesc={setShortDesc}
              description={description} onDescription={setDescription}
              images={images} onImages={setImages}
              unitSystems={unitSystems} onUnitSystems={setUnitSystems}
              categoryId={categoryId} onCategory={setCategoryId}
              categories={categories}
              showTemplateLink={!showTemplates && !calculator}
              onShowTemplates={() => setShowTemplates(true)}
            />
          )}

          {step === 1 && (
            <StepInputs
              fields={fields} unitSystems={unitSystems}
              onAdd={addField} onAddTemplate={addTemplateField}
              onUpdate={updateField} onRemove={removeField} onMove={moveField}
              tables={tables} onTables={setTables}
            />
          )}

          {step === 2 && (
            <StepFormulas fields={fields} outputs={outputs} unitSystems={unitSystems} knownVars={knownVars} onAdd={addOutput} onUpdate={updateOutput} onRemove={removeOutput} onMove={moveOutput} />
          )}

          {step === 3 && (
            <StepReview
              issues={issues} fieldCount={fields.length} outputCount={outputs.length}
              fields={fields} outputs={outputs}
              isPublished={isPublished} onPublished={setIsPublished}
              isFeatured={isFeatured} onFeatured={setIsFeatured}
              sortOrder={sortOrder} onSortOrder={setSortOrder}
              seoTitle={seoTitle} onSeoTitle={setSeoTitle}
              seoDesc={seoDesc} onSeoDesc={setSeoDesc}
              onGo={setStep}
            />
          )}
        </div>
      </div>

      {/* Navigation bar */}
      <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-5">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        <div className="flex items-center gap-3">
          <span className={cn("hidden sm:flex text-xs items-center gap-1", isPublished ? "text-emerald-600" : "text-amber-600")}>
            {isPublished ? <><CheckCircle2 className="size-3" /> Will be published</> : "Saving as draft"}
          </span>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 transition-colors"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          {isLast ? (
            <button
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-60 transition-colors"
            >
              <Check className="size-4" />
              {isPending ? "Saving…" : calculator ? "Save Changes" : "Create Engineering Tool"}
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => Math.min(STEP_META.length - 1, s + 1))}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Next <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Live Preview trigger */}
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-zinc-700 transition-colors"
      >
        <Eye className="size-4" /> Live Preview
      </button>

      {/* Live Preview drawer */}
      {previewOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" onClick={() => setPreviewOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-1/2 sm:min-w-[520px] bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-primary" />
                <p className="text-sm font-bold text-zinc-900">Live Preview</p>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="rounded-md p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors" aria-label="Close preview">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {fields.length === 0 && outputs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-white py-12 text-center">
                  <Eye className="size-7 text-zinc-200 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">Your engineering tool will appear here as you build it.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-bold text-zinc-900 mb-3">{title || "Untitled Engineering Tool"}</p>
                  <CalculatorRunner key={previewKey} calculator={previewCalc} preview />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ current, counts, onGo }: { current: number; counts: (number | undefined)[]; onGo: (n: number) => void }) {
  return (
    <div className="flex items-center">
      {STEP_META.map(({ label, icon: Icon }, i) => {
        const done = i < current
        const active = i === current
        const count = counts[i]
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => onGo(i)}
              className="flex items-center gap-2.5 group"
            >
              <span className={cn(
                "flex size-8 items-center justify-center rounded-full border text-sm font-semibold transition-colors shrink-0",
                active ? "border-primary bg-primary text-white"
                  : done ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-zinc-300 bg-white text-zinc-400 group-hover:border-zinc-400"
              )}>
                {done ? <Check className="size-4" /> : <Icon className="size-4" />}
              </span>
              <span className="text-left hidden sm:block">
                <span className={cn("block text-sm font-semibold leading-tight", active ? "text-zinc-900" : "text-zinc-500")}>
                  {label}
                  {count !== undefined && count > 0 && <span className="ml-1 text-xs font-normal text-zinc-400">({count})</span>}
                </span>
                <span className="block text-[11px] text-zinc-400">Step {i + 1}</span>
              </span>
            </button>
            {i < STEP_META.length - 1 && (
              <span className={cn("h-px flex-1 mx-3 min-w-4", done ? "bg-emerald-500" : "bg-zinc-200")} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1: Details ──────────────────────────────────────────────────────────

function StepDetails(props: {
  title: string; onTitle: (v: string) => void
  slug: string; onSlug: (v: string) => void
  shortDesc: string; onShortDesc: (v: string) => void
  description: string; onDescription: (v: string) => void
  images: string[]; onImages: (v: string[]) => void
  unitSystems: UnitSystem[]; onUnitSystems: (v: UnitSystem[]) => void
  categoryId: string; onCategory: (v: string) => void
  categories: CalcCategory[]
  showTemplateLink: boolean; onShowTemplates: () => void
}) {
  return (
    <div className="space-y-5 bg-white rounded-xl border border-zinc-200 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Engineering Tool Details</h3>
        {props.showTemplateLink && (
          <button onClick={props.onShowTemplates} className="text-xs text-primary hover:underline">Use a template</button>
        )}
      </div>
      <div>
        <Label required>Title</Label>
        <Input value={props.title} onChange={(e) => props.onTitle(e.target.value)} placeholder="e.g. Injection Molding Cycle Time" />
      </div>
      <div>
        <Label required>URL Slug</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 whitespace-nowrap">/tools/</span>
          <Input value={props.slug} onChange={(e) => props.onSlug(e.target.value)} placeholder="injection-molding-cycle-time" className="font-mono" />
        </div>
      </div>
      <div>
        <Label>Short Description</Label>
        <Input value={props.shortDesc} onChange={(e) => props.onShortDesc(e.target.value)} placeholder="One-line description shown in cards" />
      </div>
      <div>
        <Label>Full Description</Label>
        <RichTextEditor
          value={toDoc(props.description)}
          onChange={(v) => props.onDescription(fromDoc(v))}
          placeholder="Detailed explanation, formula notes, assumptions…"
          minHeight={180}
        />
        <p className="text-xs text-zinc-400 mt-1">Shown in the &ldquo;About This Calculator&rdquo; box.</p>
      </div>
      <div>
        <Label>Images</Label>
        <div className="space-y-2">
          {props.images.map((key, i) => (
            <FilePreview
              key={`${key}-${i}`}
              value={key}
              onClear={() => props.onImages(props.images.filter((_, j) => j !== i))}
            />
          ))}
          {/* Remounted per upload so the field resets and can take the next one. */}
          <CroppableFileUploadField
            key={`calc-img-${props.images.length}`}
            folder="calculators/covers"
            aspect={16 / 9}
            label="Click to add an image (16:9)"
            existingValue={null}
            onUploadSuccess={({ key }) => props.onImages([...props.images, key])}
          />
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Optional. Shown above the tool on its public page — one image is centred, several become a gallery.
        </p>
      </div>

      <div>
        <Label>Unit System</Label>
        {props.unitSystems.length === 0 ? (
          <button
            type="button"
            onClick={() => props.onUnitSystems(DEFAULT_UNIT_SYSTEMS)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="size-4" /> Add a unit switcher
          </button>
        ) : (
          <div className="space-y-2">
            {props.unitSystems.map((u, i) => (
              <div key={u.key} className="flex items-center gap-2">
                <span className="w-20 shrink-0 font-mono text-xs text-zinc-400">{u.key}</span>
                <Input
                  value={u.label}
                  onChange={(e) => props.onUnitSystems(props.unitSystems.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                  placeholder="Metric (cm/kg/s)"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => props.onUnitSystems([])}
              className="text-xs text-zinc-400 transition-colors hover:text-red-600"
            >
              Remove the unit switcher
            </button>
          </div>
        )}
        <p className="text-xs text-zinc-400 mt-1">
          Optional. With this on, each input and result can carry a unit and a conversion factor per system —
          write your formulas for one system, and the other is converted for you.
        </p>
      </div>
      <div>
        <Label>Category</Label>
        <Select value={props.categoryId} onChange={(e) => props.onCategory(e.target.value)}>
          <option value="">— No category —</option>
          {props.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>
    </div>
  )
}

// ── Step 2: Inputs ───────────────────────────────────────────────────────────

function StepInputs({ fields, unitSystems, onAdd, onAddTemplate, onUpdate, onRemove, onMove, tables, onTables }: {
  fields: DraftField[]
  unitSystems: UnitSystem[]
  onAdd: () => void
  onAddTemplate: (patch: Partial<DraftField>) => void
  onUpdate: <K extends keyof DraftField>(uid: string, key: K, val: DraftField[K]) => void
  onRemove: (uid: string) => void
  onMove: (idx: number, dir: 1 | -1) => void
  tables: DraftTable[]
  onTables: (v: DraftTable[]) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          The boxes people fill in. Each one has a <strong>key</strong> you&rsquo;ll use in formulas.
        </p>
        <button type="button" onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors shrink-0">
          <Plus className="size-4" /> Add Input
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-400">Common inputs:</span>
        {FIELD_TEMPLATES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onAddTemplate(t.build())}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="size-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600">
        <p className="flex items-center gap-1.5 font-semibold text-zinc-800">
          <Info className="size-3.5" /> Looking for the material / reference table?
        </p>
        <p className="mt-1 leading-relaxed">
          It lives inside a <strong>Dropdown</strong> input. Open the input below (or add one and
          set its type to Dropdown) to add, edit or delete materials and their property columns.
          Formulas are edited on the next step.
        </p>
      </div>

      {fields.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-zinc-200 py-12 text-center">
          <FlaskConical className="size-8 text-zinc-200 mx-auto mb-2" />
          <p className="text-sm text-zinc-400">No inputs yet. Add your first one.</p>
        </div>
      )}

      {fields.map((field, idx) => (
        <FieldCard key={field._uid} field={field} unitSystems={unitSystems} idx={idx} total={fields.length} onUpdate={onUpdate} onRemove={onRemove} onMove={onMove} />
      ))}

      <TablesEditor tables={tables} onChange={onTables} />
    </div>
  )
}

// ── Reference tables ─────────────────────────────────────────────────────────
// Standalone lookup tables, independent of any dropdown. Cells are free text so
// a range ("0.5 - 0.7") or a note is as valid as a number.

function TablesEditor({ tables, onChange }: { tables: DraftTable[]; onChange: (v: DraftTable[]) => void }) {
  const update = (i: number, patch: Partial<DraftTable>) =>
    onChange(tables.map((t, j) => (j === i ? { ...t, ...patch } : t)))

  return (
    <div className="space-y-3 border-t border-zinc-200 pt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Reference tables</p>
          <p className="text-xs text-zinc-500">
            Lookup tables shown under the tool. Visitors can search them, and a category groups them into filters.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...tables, { _uid: uid(), title: "", category: "", columns: [], rows: [] }])}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-4" /> Add table
        </button>
      </div>

      {tables.map((t, i) => (
        <TableCard
          key={t._uid}
          table={t}
          onChange={(patch) => update(i, patch)}
          onRemove={() => onChange(tables.filter((_, j) => j !== i))}
        />
      ))}
    </div>
  )
}

function TableCard({ table, onChange, onRemove }: {
  table: DraftTable
  onChange: (patch: Partial<DraftTable>) => void
  onRemove: () => void
}) {
  const cellClass = "w-full rounded-md border border-zinc-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"

  const setColumn = (id: string, patch: Partial<DraftTable["columns"][number]>) =>
    onChange({ columns: table.columns.map((c) => (c.id === id ? { ...c, ...patch } : c)) })

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Input value={table.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Table title" />
        <Input value={table.category} onChange={(e) => onChange({ category: e.target.value })} placeholder="Category (optional)" />
        <button type="button" onClick={onRemove} className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600">
          <Trash2 className="size-4" />
        </button>
      </div>

      {table.columns.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1">
            <thead>
              <tr>
                {table.columns.map((c) => (
                  <th key={c.id} className="text-left">
                    <div className="flex items-center gap-0.5">
                      <input
                        value={c.label}
                        onChange={(e) => setColumn(c.id, { label: e.target.value })}
                        placeholder="Column"
                        className={cn(cellClass, "min-w-24")}
                      />
                      <input
                        value={c.unit}
                        onChange={(e) => setColumn(c.id, { unit: e.target.value })}
                        placeholder="unit"
                        className={cn(cellClass, "w-16")}
                      />
                      <button
                        type="button"
                        onClick={() => onChange({ columns: table.columns.filter((x) => x.id !== c.id) })}
                        className="rounded p-1 text-zinc-300 hover:text-red-600"
                        title="Remove column"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="w-6" />
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r) => (
                <tr key={r.id}>
                  {table.columns.map((c) => (
                    <td key={c.id}>
                      <input
                        value={r.cells[c.key] ?? ""}
                        onChange={(e) => onChange({
                          rows: table.rows.map((x) => x.id === r.id ? { ...x, cells: { ...x.cells, [c.key]: e.target.value } } : x),
                        })}
                        className={cn(cellClass, "min-w-24")}
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      type="button"
                      onClick={() => onChange({ rows: table.rows.filter((x) => x.id !== r.id) })}
                      className="rounded p-1 text-zinc-300 hover:text-red-600"
                      title="Remove row"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange({ columns: [...table.columns, { id: uid(), key: `col_${table.columns.length + 1}`, label: "", unit: "" }] })}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-3.5" /> Add column
        </button>
        <button
          type="button"
          disabled={table.columns.length === 0}
          onClick={() => onChange({ rows: [...table.rows, { id: uid(), cells: {} }] })}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
        >
          <Plus className="size-3.5" /> Add row
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Formulas ─────────────────────────────────────────────────────────

function StepFormulas({ fields, outputs, unitSystems, knownVars, onAdd, onUpdate, onRemove, onMove }: {
  fields: DraftField[]
  outputs: DraftOutput[]
  unitSystems: UnitSystem[]
  knownVars: string[]
  onAdd: () => void
  onUpdate: <K extends keyof DraftOutput>(uid: string, key: K, val: DraftOutput[K]) => void
  onRemove: (uid: string) => void
  onMove: (idx: number, dir: 1 | -1) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">The results, each from a formula that uses your input keys.</p>
        <button type="button" onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors shrink-0">
          <Plus className="size-4" /> Add Result
        </button>
      </div>

      {/* Formula help */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800 space-y-1.5">
        <p className="font-semibold flex items-center gap-1.5"><Info className="size-3.5" /> Formula Reference</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 font-mono">
          <span>pi → {Math.PI.toFixed(5)}… / e</span>
          <span>+ - * / and x^y (power)</span>
          <span>sqrt(x) → square root</span>
          <span>pow(x, y) → x raised to y</span>
          <span>log(x) → natural log (ln)</span>
          <span>log10(x) → base-10 log</span>
          <span>abs(x) → absolute value</span>
          <span>sin(x) / cos(x) / tan(x)</span>
          <span>min(a, b) / max(a, b)</span>
          <span>floor(x) / ceil(x) / round(x)</span>
        </div>
        <p className="mt-1.5 leading-relaxed">
          Formulas can reference input keys, variables from a <strong>material preset</strong> dropdown, and
          <strong> earlier results</strong>. Results compute top-to-bottom, so a
          <code className="bg-blue-100 px-1 rounded mx-0.5">total</code> can be
          <code className="bg-blue-100 px-1 rounded mx-0.5">t0 + ti + th + tc</code>.
        </p>
      </div>

      {outputs.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-zinc-200 py-12 text-center">
          <Zap className="size-8 text-zinc-200 mx-auto mb-2" />
          <p className="text-sm text-zinc-400">No results yet. Add a formula.</p>
        </div>
      )}

      {outputs.map((output, idx) => (
        <OutputCard
          key={output._uid}
          output={output}
          unitSystems={unitSystems}
          idx={idx}
          total={outputs.length}
          knownVars={knownVars}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onMove={onMove}
        />
      ))}
    </div>
  )
}

// ── Step 4: Review ───────────────────────────────────────────────────────────

function StepReview(props: {
  issues: string[]; fieldCount: number; outputCount: number
  fields: DraftField[]; outputs: DraftOutput[]
  isPublished: boolean; onPublished: (v: boolean) => void
  isFeatured: boolean; onFeatured: (v: boolean) => void
  sortOrder: string; onSortOrder: (v: string) => void
  seoTitle: string; onSeoTitle: (v: string) => void
  seoDesc: string; onSeoDesc: (v: string) => void
  onGo: (n: number) => void
}) {
  const ready = props.issues.length === 0
  return (
    <div className="space-y-5">
      <div className={cn("rounded-xl border p-5", ready ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
        <div className="flex items-center gap-2 mb-2">
          {ready ? <CheckCircle2 className="size-5 text-emerald-600" /> : <AlertTriangle className="size-5 text-amber-600" />}
          <p className={cn("text-sm font-bold", ready ? "text-emerald-800" : "text-amber-800")}>
            {ready ? "Ready to publish" : `${props.issues.length} thing${props.issues.length > 1 ? "s" : ""} to finish`}
          </p>
        </div>
        {ready ? (
          <p className="text-sm text-emerald-700">
            {props.fieldCount} input{props.fieldCount !== 1 ? "s" : ""} and {props.outputCount} result{props.outputCount !== 1 ? "s" : ""}. Turn on Published below and save.
          </p>
        ) : (
          <ul className="space-y-1 text-sm text-amber-800">
            {props.issues.map((iss, i) => <li key={i} className="flex gap-2"><span>•</span><span>{iss}</span></li>)}
          </ul>
        )}
        {!ready && (
          <div className="flex gap-2 mt-3">
            <button onClick={() => props.onGo(1)} className="text-xs font-medium text-amber-800 underline hover:no-underline">Go to Inputs</button>
            <button onClick={() => props.onGo(2)} className="text-xs font-medium text-amber-800 underline hover:no-underline">Go to Formulas</button>
          </div>
        )}
      </div>

      {/* What's configured — so formulas and reference tables are visible without hunting */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Formulas &amp; Data</h3>
          <button onClick={() => props.onGo(2)} className="text-xs font-medium text-primary underline hover:no-underline">
            Edit formulas
          </button>
        </div>

        {props.outputs.length === 0 ? (
          <p className="text-sm text-zinc-400">No results defined yet.</p>
        ) : (
          <ul className="space-y-2">
            {props.outputs.map((o) => (
              <li key={o._uid} className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                <span className="text-xs font-semibold text-zinc-800">{o.label || "Untitled result"}</span>
                <code className="ml-2 font-mono text-xs text-zinc-500 break-all">
                  {o.output_key || "?"} = {o.formula || "—"}
                </code>
              </li>
            ))}
          </ul>
        )}

        {props.fields.filter((f) => f.field_type === "select").length > 0 && (
          <div className="pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-zinc-700">Reference tables</p>
              <button onClick={() => props.onGo(1)} className="text-xs font-medium text-primary underline hover:no-underline">
                Edit tables
              </button>
            </div>
            <ul className="space-y-1">
              {props.fields.filter((f) => f.field_type === "select").map((f) => {
                const rows = parseOptions(f.options_text) ?? []
                const cols = Object.keys(rows[0]?.values ?? {})
                return (
                  <li key={f._uid} className="text-xs text-zinc-500">
                    <span className="font-medium text-zinc-700">{f.label || f.field_key}</span>
                    {" — "}{rows.length} row{rows.length !== 1 ? "s" : ""}
                    {cols.length > 0 && <> · columns: <code className="font-mono">{cols.join(", ")}</code></>}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Visibility</h3>
        <Toggle label="Published" hint="Visible to the public on /tools" checked={props.isPublished} onChange={props.onPublished} />
        <Toggle label="Featured" hint="Highlighted in the featured section" checked={props.isFeatured} onChange={props.onFeatured} />
        <div>
          <Label>Sort Order</Label>
          <Input type="number" value={props.sortOrder} onChange={(e) => props.onSortOrder(e.target.value)} placeholder="0" className="w-28" />
          <p className="text-xs text-zinc-400 mt-1">Lower numbers appear first</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">SEO (optional)</h3>
        <div>
          <Label>SEO Title</Label>
          <Input value={props.seoTitle} onChange={(e) => props.onSeoTitle(e.target.value)} placeholder="Defaults to calculator title" />
        </div>
        <div>
          <Label>SEO Description</Label>
          <Textarea value={props.seoDesc} onChange={(e) => props.onSeoDesc(e.target.value)} placeholder="Short description for search engines" rows={2} />
        </div>
      </div>
    </div>
  )
}

// ── Toggle ─────────────────────────────────────────────────────────────────────

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <div>
        <p className="text-sm font-medium text-zinc-800">{label}</p>
        <p className="text-xs text-zinc-400">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 rounded-full transition-colors", checked ? "bg-primary" : "bg-zinc-200")}
      >
        <span className={cn("absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "")} />
      </button>
    </label>
  )
}

/**
 * Per-system unit + factor. `factor` is how many of this system's units make
 * one base unit, so the base system's row is simply 1.
 */
function UnitsEditor({ systems, value, onChange }: {
  systems: UnitSystem[]
  value: DraftUnits
  onChange: (v: DraftUnits) => void
}) {
  if (systems.length === 0) return null
  const set = (key: string, patch: Partial<{ unit: string; factor: string }>) =>
    onChange({ ...value, [key]: { unit: value[key]?.unit ?? "", factor: value[key]?.factor ?? "1", ...patch } })

  return (
    <div className="sm:col-span-2 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 space-y-2">
      <p className="text-[11px] font-medium text-zinc-500">
        Units per system — leave the system your formula is written in at factor <code>1</code>.
      </p>
      {systems.map((sys) => (
        <div key={sys.key} className="flex items-center gap-2">
          <span className="w-32 shrink-0 truncate text-xs text-zinc-500" title={sys.label}>{sys.label}</span>
          <Input
            value={value[sys.key]?.unit ?? ""}
            onChange={(e) => set(sys.key, { unit: e.target.value })}
            placeholder="unit"
            className="text-xs"
          />
          <Input
            value={value[sys.key]?.factor ?? ""}
            onChange={(e) => set(sys.key, { factor: e.target.value })}
            placeholder="factor"
            className="font-mono text-xs"
          />
        </div>
      ))}
    </div>
  )
}

// ── FieldCard ──────────────────────────────────────────────────────────────────

interface FieldCardProps {
  field: DraftField
  unitSystems: UnitSystem[]
  idx: number
  total: number
  onUpdate: <K extends keyof DraftField>(uid: string, key: K, val: DraftField[K]) => void
  onRemove: (uid: string) => void
  onMove: (idx: number, dir: 1 | -1) => void
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  number: "Number", text: "Text", select: "Dropdown", checkbox: "Checkbox", range: "Slider",
}

function FieldCard({ field, unitSystems, idx, total, onUpdate, onRemove, onMove }: FieldCardProps) {
  const [expanded, setExpanded] = useState(true)
  const u = <K extends keyof DraftField>(k: K, v: DraftField[K]) => onUpdate(field._uid, k, v)

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 border-b border-zinc-200">
        <ReorderBtns idx={idx} total={total} onMove={(d) => onMove(idx, d)} />
        <button onClick={() => setExpanded((e) => !e)} className="flex-1 text-left">
          <span className="text-sm font-semibold text-zinc-900">
            {field.label || <em className="text-zinc-400 font-normal">Untitled input</em>}
          </span>
          {field.field_key && <code className="ml-2 text-xs bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded">{field.field_key}</code>}
          <span className="ml-2 text-xs text-zinc-400">{FIELD_TYPE_LABELS[field.field_type]}</span>
          {field.field_type === "select" && (
            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              {(parseOptions(field.options_text) ?? []).length} rows · reference table
            </span>
          )}
        </button>
        <button onClick={() => onRemove(field._uid)} className="rounded-md p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors">
          <Trash2 className="size-4" />
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Label <span className="text-red-500">*</span></label>
              <Input value={field.label} onChange={(e) => u("label", e.target.value)} placeholder="e.g. Wall Thickness" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Key <span className="text-red-500">*</span>
                <span className="ml-1 text-zinc-400 font-normal normal-case">(used in formulas)</span>
              </label>
              <Input value={field.field_key} onChange={(e) => u("field_key", e.target.value.replace(/\W/g, "_"))} placeholder="wall" className="font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Type</label>
              <Select value={field.field_type} onChange={(e) => u("field_type", e.target.value as FieldType)}>
                <option value="number">Number</option>
                <option value="text">Text</option>
                <option value="select">Dropdown</option>
                <option value="checkbox">Checkbox</option>
                <option value="range">Slider</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Unit</label>
              <Input value={field.unit} onChange={(e) => u("unit", e.target.value)} placeholder="mm, kg, MPa…" />
            </div>
            <UnitsEditor systems={unitSystems} value={field.units} onChange={(v) => u("units", v)} />
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Placeholder</label>
              <Input value={field.placeholder} onChange={(e) => u("placeholder", e.target.value)} placeholder="e.g. Enter thickness" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Help Text</label>
              <Input value={field.help_text} onChange={(e) => u("help_text", e.target.value)} placeholder="Short hint shown under the field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Group <span className="ml-1 text-zinc-400 font-normal normal-case">(optional section heading)</span>
              </label>
              <Input value={field.field_group} onChange={(e) => u("field_group", e.target.value)} placeholder="e.g. Part & Machine" />
            </div>
          </div>

          {(field.field_type === "number" || field.field_type === "range") && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Min</label>
                <Input type="number" value={field.min_value} onChange={(e) => u("min_value", e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Max</label>
                <Input type="number" value={field.max_value} onChange={(e) => u("max_value", e.target.value)} placeholder="1000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Step</label>
                <Input type="number" value={field.step_value} onChange={(e) => u("step_value", e.target.value)} placeholder="0.01" />
              </div>
            </div>
          )}

          {field.field_type === "select" && (
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Options &amp; Reference Table
              </label>
              <div className="mb-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                <p className="flex items-center gap-1.5 font-semibold">
                  <Info className="size-3.5" /> This is the material table
                </p>
                <p className="mt-1 leading-relaxed">
                  Each <strong>row</strong> is a dropdown choice (e.g. a material). Each{" "}
                  <strong>column</strong> is a property whose key you can use in formulas
                  (e.g. <code className="font-mono">alpha</code>,{" "}
                  <code className="font-mono">melt_temp</code>). Add, edit or delete rows and
                  columns here — this exact table is what visitors see under
                  &ldquo;{field.label || "…"} — Reference Values&rdquo; on the public page.
                </p>
              </div>
              <OptionsEditor value={field.options_text} onChange={(json) => u("options_text", json)} />
            </div>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={field.is_required} onChange={(e) => u("is_required", e.target.checked)} className="rounded" />
              <span className="text-sm text-zinc-700">Required</span>
            </label>
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-600 mb-1">Default Value</label>
              <Input value={field.default_value} onChange={(e) => u("default_value", e.target.value)} placeholder="optional" className="max-w-48" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── OptionsEditor (visual, no JSON) ──────────────────────────────────────────
// Controlled by the field's options_text (JSON string); keeps its own working
// model in state and serialises on every edit.

interface OptCol { id: string; key: string }
interface OptRow { id: string; label: string; value: string; vals: Record<string, string> }

function parseOptionState(text: string): { rows: OptRow[]; cols: OptCol[] } {
  const arr = parseOptions(text) ?? []
  const keys: string[] = []
  for (const o of arr) for (const k of Object.keys(o.values ?? {})) if (!keys.includes(k)) keys.push(k)
  const cols: OptCol[] = keys.map((k) => ({ id: uid(), key: k }))
  const rows: OptRow[] = arr.map((o) => {
    const vals: Record<string, string> = {}
    for (const c of cols) { const v = o.values?.[c.key]; if (v !== undefined) vals[c.id] = String(v) }
    return { id: uid(), label: String(o.label ?? ""), value: String(o.value ?? ""), vals }
  })
  return { rows, cols }
}

function OptionsEditor({ value, onChange }: { value: string; onChange: (json: string) => void }) {
  const [state, setState] = useState(() => parseOptionState(value))
  const { rows, cols } = state

  function commit(next: { rows: OptRow[]; cols: OptCol[] }) {
    setState(next)
    const arr = next.rows.map((r) => {
      const base: { label: string; value: string; values?: Record<string, number> } = {
        label: r.label, value: r.value.trim() || optSlug(r.label),
      }
      if (next.cols.length) {
        const values: Record<string, number> = {}
        for (const c of next.cols) {
          const key = c.key.trim()
          const raw = r.vals[c.id]
          if (key && raw !== undefined && raw !== "") {
            const n = parseFloat(raw)
            if (!isNaN(n)) values[key] = n
          }
        }
        base.values = values
      }
      return base
    })
    onChange(JSON.stringify(arr))
  }

  const addRow = () => commit({ ...state, rows: [...rows, { id: uid(), label: "", value: "", vals: {} }] })
  const removeRow = (id: string) => commit({ ...state, rows: rows.filter((r) => r.id !== id) })
  const setRow = (id: string, patch: Partial<OptRow>) => commit({ ...state, rows: rows.map((r) => r.id === id ? { ...r, ...patch } : r) })
  const setCell = (rid: string, cid: string, v: string) => commit({ ...state, rows: rows.map((r) => r.id === rid ? { ...r, vals: { ...r.vals, [cid]: v } } : r) })
  const addCol = () => commit({ ...state, cols: [...cols, { id: uid(), key: "" }] })
  const setColKey = (id: string, key: string) => commit({ ...state, cols: cols.map((c) => c.id === id ? { ...c, key: key.replace(/\W/g, "_") } : c) })
  const removeCol = (id: string) => commit({
    cols: cols.filter((c) => c.id !== id),
    rows: rows.map((r) => { const v = { ...r.vals }; delete v[id]; return { ...r, vals: v } }),
  })

  const cellClass = "w-full rounded-md border border-zinc-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 space-y-3">
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-400 py-2 text-center">No options yet — add the choices for this dropdown.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="text-left"><span className="text-[11px] font-medium text-zinc-500 px-1">Choice label</span></th>
                {cols.map((c) => (
                  <th key={c.id} className="text-left">
                    <div className="flex items-center gap-0.5">
                      <input
                        value={c.key}
                        onChange={(e) => setColKey(c.id, e.target.value)}
                        placeholder="property"
                        className={cn(cellClass, "font-mono min-w-24 bg-white")}
                      />
                      <button type="button" onClick={() => removeCol(c.id)} className="rounded p-1 text-zinc-300 hover:text-red-600" title="Remove property">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="w-6" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <input value={r.label} onChange={(e) => setRow(r.id, { label: e.target.value })} placeholder="e.g. ABS" className={cn(cellClass, "min-w-32 bg-white")} />
                  </td>
                  {cols.map((c) => (
                    <td key={c.id}>
                      <input type="number" value={r.vals[c.id] ?? ""} onChange={(e) => setCell(r.id, c.id, e.target.value)} placeholder="0" className={cn(cellClass, "min-w-20 bg-white")} />
                    </td>
                  ))}
                  <td>
                    <button type="button" onClick={() => removeRow(r.id)} className="rounded p-1 text-zinc-300 hover:text-red-600" title="Remove option">
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={addRow} className="inline-flex items-center gap-1 rounded-md bg-white border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-primary hover:text-primary transition-colors">
          <Plus className="size-3.5" /> Add option
        </button>
        <button type="button" onClick={addCol} className="inline-flex items-center gap-1 rounded-md bg-white border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-primary hover:text-primary transition-colors">
          <Plus className="size-3.5" /> Add property value
        </button>
      </div>

      {cols.length > 0 && (
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          This is a <strong>material/preset dropdown</strong>: picking a choice loads its property values into your formulas
          (use the property names as variables), and shows a reference table on the page.
        </p>
      )}
    </div>
  )
}

// ── OutputCard ─────────────────────────────────────────────────────────────────

interface OutputCardProps {
  output: DraftOutput
  unitSystems: UnitSystem[]
  idx: number
  total: number
  knownVars: string[]
  onUpdate: <K extends keyof DraftOutput>(uid: string, key: K, val: DraftOutput[K]) => void
  onRemove: (uid: string) => void
  onMove: (idx: number, dir: 1 | -1) => void
}

function OutputCard({ output, unitSystems, idx, total, knownVars, onUpdate, onRemove, onMove }: OutputCardProps) {
  const u = <K extends keyof DraftOutput>(k: K, v: DraftOutput[K]) => onUpdate(output._uid, k, v)

  // Live formula test — every known variable (fields, presets, other outputs) = 1.
  const testVars = Object.fromEntries(knownVars.map((k) => [k, 1]))
  const preview = output.formula ? evaluateFormula(output.formula, testVars) : null

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 border-b border-zinc-200">
        <ReorderBtns idx={idx} total={total} onMove={(d) => onMove(idx, d)} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-zinc-900">
            {output.label || <em className="text-zinc-400 font-normal">Untitled result</em>}
          </span>
          {output.output_key && <code className="ml-2 text-xs bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded">{output.output_key}</code>}
        </div>
        {preview && (
          <span className={cn("text-xs px-2 py-0.5 rounded-full shrink-0", "error" in preview ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700")}>
            {"error" in preview ? `⚠ ${preview.error}` : `✓ valid`}
          </span>
        )}
        <button onClick={() => onRemove(output._uid)} className="rounded-md p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors">
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Label <span className="text-red-500">*</span></label>
            <Input value={output.label} onChange={(e) => u("label", e.target.value)} placeholder="e.g. Total Cycle Time" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Key</label>
            <Input value={output.output_key} onChange={(e) => u("output_key", e.target.value.replace(/\W/g, "_"))} placeholder="total" className="font-mono" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-600 mb-1">Formula <span className="text-red-500">*</span></label>
            <Input value={output.formula} onChange={(e) => u("formula", e.target.value)} placeholder="pi * radius * radius" className="font-mono" />
            {knownVars.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                <span className="text-[11px] text-zinc-400 mr-0.5">Insert:</span>
                {knownVars.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => u("formula", output.formula ? `${output.formula} ${k}` : k)}
                    className="text-[11px] font-mono bg-zinc-100 hover:bg-primary/10 hover:text-primary text-zinc-600 px-1.5 py-0.5 rounded transition-colors"
                  >
                    {k}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Unit</label>
            <Input value={output.unit} onChange={(e) => u("unit", e.target.value)} placeholder="s, cm², %…" />
          </div>
          <UnitsEditor systems={unitSystems} value={output.units} onChange={(v) => u("units", v)} />
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Decimal Places</label>
            <Input type="number" min={0} max={10} value={output.decimals} onChange={(e) => u("decimals", parseInt(e.target.value) || 0)} className="w-24" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-600 mb-1">Description</label>
            <Input value={output.description} onChange={(e) => u("description", e.target.value)} placeholder="Brief note about this result" />
          </div>
        </div>
      </div>
    </div>
  )
}
