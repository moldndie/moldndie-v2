"use client"

import { useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Plus, Trash2, ChevronUp, ChevronDown, Info, Zap, Settings,
  FlaskConical, HelpCircle, CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CalcCategory, CalculatorWithRelations, FieldType } from "@/types/calculator"
import { saveFullCalculator } from "@/services/calculator.service"

function makeSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}
import { evaluateFormula } from "@/lib/formula-engine"

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
}

interface DraftOutput {
  _uid: string
  id?: string
  label: string
  output_key: string
  formula: string
  unit: string
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
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2) }

function emptyField(): DraftField {
  return { _uid: uid(), label: "", field_key: "", field_type: "number", unit: "", placeholder: "", help_text: "", is_required: true, min_value: "", max_value: "", step_value: "", default_value: "", options_text: "" }
}

function emptyOutput(): DraftOutput {
  return { _uid: uid(), label: "", output_key: "", formula: "", unit: "", decimals: 2, description: "" }
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
    options: f.field_type === "select" && f.options_text
      ? (() => { try { return JSON.parse(f.options_text) } catch { return null } })()
      : null,
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
    decimals: o.decimals,
    description: o.description || null,
    sort_order: 0,
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      {...props}
      className={cn(
        "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none",
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

export default function CalculatorBuilder({ calculator, categories }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<"basic" | "fields" | "outputs">("basic")
  const [showTemplates, setShowTemplates] = useState(!calculator)

  // Basic info state
  const [title, setTitle] = useState(calculator?.title ?? "")
  const [slug, setSlug] = useState(calculator?.slug ?? "")
  const [slugManual, setSlugManual] = useState(!!calculator)
  const [shortDesc, setShortDesc] = useState(calculator?.short_description ?? "")
  const [description, setDescription] = useState(calculator?.description ?? "")
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
    })) ?? []
  )

  // Outputs state
  const [outputs, setOutputs] = useState<DraftOutput[]>(() =>
    calculator?.outputs.map((o) => ({
      _uid: uid(), id: o.id, label: o.label, output_key: o.output_key,
      formula: o.formula, unit: o.unit ?? "", decimals: o.decimals,
      description: o.description ?? "",
    })) ?? []
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
    setActiveTab("fields")
    toast.success(`Template "${tpl.title}" applied`)
  }

  // ── Field helpers ──────────────────────────────────────────────────────────
  const addField = useCallback(() => setFields((p) => [...p, emptyField()]), [])
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

  // ── Save ───────────────────────────────────────────────────────────────────
  function handleSave() {
    if (!title.trim()) { toast.error("Title is required"); setActiveTab("basic"); return }
    if (!slug.trim()) { toast.error("Slug is required"); setActiveTab("basic"); return }

    startTransition(async () => {
      try {
        const saved = await saveFullCalculator({
          basic: {
            ...(calculator?.id ? { id: calculator.id } : {}),
            title: title.trim(),
            slug: slug.trim(),
            short_description: shortDesc || null,
            description: description || null,
            category_id: categoryId || null,
            is_featured: isFeatured,
            is_published: isPublished,
            sort_order: parseInt(sortOrder) || 0,
            seo_title: seoTitle || null,
            seo_description: seoDesc || null,
          },
          fields: fields.map(fieldToDb),
          outputs: outputs.map(outputToDb),
        })
        toast.success(calculator ? "Calculator updated" : "Calculator created")
        if (!calculator) router.push(`/dashboard/calculators/${saved.id}/edit`)
      } catch (e) {
        toast.error((e as Error).message || "Save failed")
      }
    })
  }

  const TABS = [
    { id: "basic" as const, label: "Basic Info", icon: Settings },
    { id: "fields" as const, label: `Fields (${fields.length})`, icon: FlaskConical },
    { id: "outputs" as const, label: `Outputs (${outputs.length})`, icon: Zap },
  ]

  return (
    <div className="space-y-6">
      {/* Template chooser */}
      {showTemplates && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="size-4 text-primary" />
              <p className="text-sm font-semibold text-zinc-900">Start from a template or build from scratch</p>
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

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-zinc-200">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === id
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Basic Info ─────────────────────────────────────────────────── */}
      {activeTab === "basic" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5 bg-white rounded-xl border border-zinc-200 p-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Core Details</h3>
            <div>
              <Label required>Title</Label>
              <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="e.g. Area of Circle" />
            </div>
            <div>
              <Label required>URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 whitespace-nowrap">/tools/</span>
                <Input
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugManual(true) }}
                  placeholder="area-of-circle"
                  className="font-mono"
                />
              </div>
            </div>
            <div>
              <Label>Short Description</Label>
              <Input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} placeholder="One-line description shown in cards" />
            </div>
            <div>
              <Label>Full Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed explanation of what this calculator does…" rows={4} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">— No category —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Visibility</h3>
              <Toggle label="Published" hint="Visible to public on /tools" checked={isPublished} onChange={setIsPublished} />
              <Toggle label="Featured" hint="Shown in featured section" checked={isFeatured} onChange={setIsFeatured} />
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" className="w-28" />
                <p className="text-xs text-zinc-400 mt-1">Lower numbers appear first</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">SEO (optional)</h3>
              <div>
                <Label>SEO Title</Label>
                <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Defaults to calculator title" />
              </div>
              <div>
                <Label>SEO Description</Label>
                <Textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} placeholder="Short description for search engines" rows={2} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Fields ─────────────────────────────────────────────────────── */}
      {activeTab === "fields" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Define the inputs users will fill in. Use these <strong>field keys</strong> in your output formulas.
            </p>
            <button
              type="button"
              onClick={addField}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              <Plus className="size-4" /> Add Field
            </button>
          </div>

          {fields.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-zinc-200 py-12 text-center">
              <FlaskConical className="size-8 text-zinc-200 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">No fields yet. Add your first input field.</p>
            </div>
          )}

          {fields.map((field, idx) => (
            <FieldCard
              key={field._uid}
              field={field}
              idx={idx}
              total={fields.length}
              onUpdate={updateField}
              onRemove={removeField}
              onMove={moveField}
            />
          ))}
        </div>
      )}

      {/* ── Tab: Outputs ────────────────────────────────────────────────────── */}
      {activeTab === "outputs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Define what gets calculated. Write formulas using your field keys.
            </p>
            <button
              type="button"
              onClick={addOutput}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              <Plus className="size-4" /> Add Output
            </button>
          </div>

          {/* Formula help */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5"><Info className="size-3.5" /> Formula Reference</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 font-mono">
              <span>pi → {Math.PI.toFixed(5)}…</span>
              <span>sqrt(x) → square root</span>
              <span>pow(x, y) → x raised to y</span>
              <span>abs(x) → absolute value</span>
              <span>min(a, b) / max(a, b)</span>
              <span>floor(x) / ceil(x) / round(x)</span>
            </div>
            <p className="mt-2">
              <strong>Field keys in this calculator: </strong>
              {fields.length === 0
                ? <em className="text-blue-600">no fields yet</em>
                : fields.map((f, i) => (
                  <span key={f._uid}>
                    <code className="bg-blue-100 px-1 rounded">{f.field_key || "…"}</code>
                    {i < fields.length - 1 ? ", " : ""}
                  </span>
                ))}
            </p>
          </div>

          {outputs.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-zinc-200 py-12 text-center">
              <Zap className="size-8 text-zinc-200 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">No outputs yet. Add a formula output.</p>
            </div>
          )}

          {outputs.map((output, idx) => (
            <OutputCard
              key={output._uid}
              output={output}
              idx={idx}
              total={outputs.length}
              fieldKeys={fields.map((f) => f.field_key).filter(Boolean)}
              onUpdate={updateOutput}
              onRemove={removeOutput}
              onMove={moveOutput}
            />
          ))}
        </div>
      )}

      {/* Save bar */}
      <div className="flex items-center justify-between border-t border-zinc-200 pt-5">
        {!showTemplates && !calculator && (
          <button onClick={() => setShowTemplates(true)} className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
            ← Use a template
          </button>
        )}
        <div className="flex items-center gap-3 ml-auto">
          <span className={cn("text-xs", isPublished ? "text-emerald-600 flex items-center gap-1" : "text-amber-600")}>
            {isPublished ? <><CheckCircle2 className="size-3" /> Will be published</> : "Saving as draft"}
          </span>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-60 transition-colors"
          >
            {isPending ? "Saving…" : calculator ? "Save Changes" : "Create Calculator"}
          </button>
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
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-zinc-200"
        )}
      >
        <span className={cn("absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "")} />
      </button>
    </label>
  )
}

// ── FieldCard ──────────────────────────────────────────────────────────────────

interface FieldCardProps {
  field: DraftField
  idx: number
  total: number
  onUpdate: <K extends keyof DraftField>(uid: string, key: K, val: DraftField[K]) => void
  onRemove: (uid: string) => void
  onMove: (idx: number, dir: 1 | -1) => void
}

function FieldCard({ field, idx, total, onUpdate, onRemove, onMove }: FieldCardProps) {
  const [expanded, setExpanded] = useState(true)
  const u = <K extends keyof DraftField>(k: K, v: DraftField[K]) => onUpdate(field._uid, k, v)

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 border-b border-zinc-200">
        <ReorderBtns idx={idx} total={total} onMove={(d) => onMove(idx, d)} />
        <button onClick={() => setExpanded((e) => !e)} className="flex-1 text-left">
          <span className="text-sm font-semibold text-zinc-900">
            {field.label || <em className="text-zinc-400 font-normal">Untitled field</em>}
          </span>
          {field.field_key && <code className="ml-2 text-xs bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded">{field.field_key}</code>}
          <span className="ml-2 text-xs text-zinc-400 capitalize">{field.field_type}</span>
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
              <Input value={field.label} onChange={(e) => u("label", e.target.value)} placeholder="e.g. Radius" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Field Key <span className="text-red-500">*</span>
                <span className="ml-1 text-zinc-400 font-normal normal-case">(used in formulas)</span>
              </label>
              <Input value={field.field_key} onChange={(e) => u("field_key", e.target.value.replace(/\W/g, "_"))} placeholder="radius" className="font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Type</label>
              <Select value={field.field_type} onChange={(e) => u("field_type", e.target.value as FieldType)}>
                <option value="number">Number</option>
                <option value="text">Text</option>
                <option value="select">Select / Dropdown</option>
                <option value="checkbox">Checkbox</option>
                <option value="range">Range Slider</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Unit</label>
              <Input value={field.unit} onChange={(e) => u("unit", e.target.value)} placeholder="cm, kg, MPa…" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Placeholder</label>
              <Input value={field.placeholder} onChange={(e) => u("placeholder", e.target.value)} placeholder="e.g. Enter radius" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Help Text</label>
              <Input value={field.help_text} onChange={(e) => u("help_text", e.target.value)} placeholder="Short hint shown under the field" />
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
              <label className="block text-xs font-medium text-zinc-600 mb-1">Options (JSON)</label>
              <textarea
                rows={3}
                value={field.options_text}
                onChange={(e) => u("options_text", e.target.value)}
                placeholder={'[{"label":"Option A","value":"a"},{"label":"Option B","value":"b"}]'}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
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

// ── OutputCard ─────────────────────────────────────────────────────────────────

interface OutputCardProps {
  output: DraftOutput
  idx: number
  total: number
  fieldKeys: string[]
  onUpdate: <K extends keyof DraftOutput>(uid: string, key: K, val: DraftOutput[K]) => void
  onRemove: (uid: string) => void
  onMove: (idx: number, dir: 1 | -1) => void
}

function OutputCard({ output, idx, total, fieldKeys, onUpdate, onRemove, onMove }: OutputCardProps) {
  const u = <K extends keyof DraftOutput>(k: K, v: DraftOutput[K]) => onUpdate(output._uid, k, v)

  // Live formula test
  const testVars = Object.fromEntries(fieldKeys.map((k) => [k, 1]))
  const preview = output.formula
    ? evaluateFormula(output.formula, testVars)
    : null

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 border-b border-zinc-200">
        <ReorderBtns idx={idx} total={total} onMove={(d) => onMove(idx, d)} />
        <div className="flex-1">
          <span className="text-sm font-semibold text-zinc-900">
            {output.label || <em className="text-zinc-400 font-normal">Untitled output</em>}
          </span>
          {output.output_key && <code className="ml-2 text-xs bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded">{output.output_key}</code>}
          {output.formula && (
            <code className="ml-2 text-xs text-blue-600">= {output.formula.slice(0, 40)}{output.formula.length > 40 ? "…" : ""}</code>
          )}
        </div>
        {preview && (
          <span className={cn("text-xs px-2 py-0.5 rounded-full", "error" in preview ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700")}>
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
            <Input value={output.label} onChange={(e) => u("label", e.target.value)} placeholder="e.g. Area" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Output Key</label>
            <Input value={output.output_key} onChange={(e) => u("output_key", e.target.value.replace(/\W/g, "_"))} placeholder="area" className="font-mono" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-600 mb-1">Formula <span className="text-red-500">*</span></label>
            <Input
              value={output.formula}
              onChange={(e) => u("formula", e.target.value)}
              placeholder="pi * radius * radius"
              className="font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Unit</label>
            <Input value={output.unit} onChange={(e) => u("unit", e.target.value)} placeholder="cm², kN, %…" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Decimal Places</label>
            <Input type="number" min={0} max={10} value={output.decimals} onChange={(e) => u("decimals", parseInt(e.target.value) || 0)} className="w-24" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-600 mb-1">Description</label>
            <Input value={output.description} onChange={(e) => u("description", e.target.value)} placeholder="Brief note about this output" />
          </div>
        </div>
      </div>
    </div>
  )
}
