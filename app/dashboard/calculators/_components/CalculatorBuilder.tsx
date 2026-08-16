"use client"

import { useState, useTransition, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Plus, Zap, Settings, FlaskConical, CheckCircle2, ArrowLeft, ArrowRight,
  Eye, Check, AlertTriangle, Copy, Sparkles, FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toDoc, fromDoc } from "@/lib/richtext"
import { Textarea } from "@/components/ui/textarea"
import { Drawer } from "@/components/ui/Drawer"
import RichTextEditor from "@/components/editor/RichTextEditor"
import { CroppableFileUploadField } from "@/components/forms/CroppableFileUploadField"
import { FilePreview } from "@/components/forms/FilePreview"
import { saveFullCalculator } from "@/services/calculator.service"
import { evaluateFormula } from "@/lib/formula-engine"
import CalculatorRunner from "@/app/tools/[slug]/CalculatorRunner"
import type {
  CalcCategory, CalculatorWithRelations, CalcField, CalcOutput, UnitSystem,
} from "@/types/calculator"

import { Advanced, FieldLabel, Input, Label, Select, Toggle } from "./ui"
import { FieldCard } from "./FieldCard"
import { OutputCard } from "./OutputCard"
import { DataTables } from "./DataTables"
import { TEMPLATES } from "./templates"
import type { VarOption } from "./FormulaEditor"
import {
  DEFAULT_UNIT_SYSTEMS, FIELD_TEMPLATES, emptyField, emptyOutput, fieldToDb,
  makeSlug, missingVars, optionsToTable, outputToDb, parseOptions, presetVarKeys,
  renameInFormulas, sampleValues, tableToDb, tableToOptionsJson, uid,
  uniqueKey, unitsToDb, unitsToDraft,
  type DraftField, type DraftOutput, type DraftTable,
} from "./builder-types"

const STEP_META = [
  { label: "Details", icon: Settings },
  { label: "Inputs", icon: FlaskConical },
  { label: "Results", icon: Zap },
  { label: "Publish", icon: CheckCircle2 },
] as const

interface Props {
  calculator?: CalculatorWithRelations
  categories: CalcCategory[]
  /** For "duplicate an existing tool" on the opening screen. */
  existing?: { id: string; title: string }[]
}

export default function CalculatorBuilder({ calculator, categories, existing = [] }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)
  // The gallery is the opening screen for a new tool, not a dismissible banner.
  const [started, setStarted] = useState(!!calculator)

  // ── Basics ─────────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(calculator?.title ?? "")
  const [slug, setSlug] = useState(calculator?.slug ?? "")
  const [slugManual, setSlugManual] = useState(!!calculator)
  const [shortDesc, setShortDesc] = useState(calculator?.short_description ?? "")
  const [description, setDescription] = useState(calculator?.description ?? "")
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

  // ── Fields / outputs / tables ──────────────────────────────────────────────
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

  const [outputs, setOutputs] = useState<DraftOutput[]>(() =>
    calculator?.outputs.map((o) => ({
      _uid: uid(), id: o.id, label: o.label, output_key: o.output_key,
      formula: o.formula, unit: o.unit ?? "", decimals: o.decimals,
      units: unitsToDraft(o.units), description: o.description ?? "",
    })) ?? []
  )

  // Tables come from two places and are edited as one list: rows stored in
  // calculator_reference_tables, plus every preset dropdown's hidden value grid,
  // which used to be a second editor with its own mental model.
  const [tables, setTables] = useState<DraftTable[]>(() => {
    const stored = calculator?.referenceTables?.map((t) => ({
      _uid: uid(), id: t.id, title: t.title, category: t.category ?? "",
      columns: (t.columns ?? []).map((c) => ({ id: uid(), key: c.key, label: c.label, unit: c.unit ?? "" })),
      rows: (t.rows ?? []).map((r) => ({ id: uid(), cells: { ...r } })),
    })) ?? []
    // `fields` is already initialised above, so this reads its first-render value.
    const derived = fields
      .filter((f) => f.field_type === "select" && (parseOptions(f.options_text) ?? []).some((o) => o.values))
      .map(optionsToTable)
    return [...stored, ...derived]
  })

  function handleTitleChange(v: string) {
    setTitle(v)
    if (!slugManual) setSlug(makeSlug(v))
  }

  // ── Keys, derived and kept in sync ─────────────────────────────────────────

  /**
   * Editing a label renames the key too — unless the row has been saved, in
   * which case the key is frozen because published formulas may reference it.
   * Any rename is mirrored into the formulas so nothing is left dangling.
   */
  const updateField = useCallback(<K extends keyof DraftField>(fieldUid: string, key: K, val: DraftField[K]) => {
    const target = fields.find((f) => f._uid === fieldUid)
    if (!target) return
    const next = { ...target, [key]: val }

    if (key === "label" && !target.id) {
      const taken = new Set(fields.filter((f) => f._uid !== fieldUid).map((f) => f.field_key))
      next.field_key = uniqueKey(String(val), taken)
    }
    setFields((prev) => prev.map((f) => (f._uid === fieldUid ? next : f)))
    if (next.field_key !== target.field_key) {
      setOutputs((prev) => renameInFormulas(prev, target.field_key, next.field_key))
    }
  }, [fields])

  const updateOutput = useCallback(<K extends keyof DraftOutput>(outUid: string, key: K, val: DraftOutput[K]) => {
    const target = outputs.find((o) => o._uid === outUid)
    if (!target) return
    const next = { ...target, [key]: val }

    if (key === "label" && !target.id) {
      const taken = new Set(outputs.filter((o) => o._uid !== outUid).map((o) => o.output_key))
      next.output_key = uniqueKey(String(val), taken, "result")
    }
    setOutputs((prev) => {
      const list = prev.map((o) => (o._uid === outUid ? next : o))
      return next.output_key !== target.output_key
        ? renameInFormulas(list, target.output_key, next.output_key)
        : list
    })
  }, [outputs])

  const addField = useCallback(() => setFields((p) => [...p, emptyField()]), [])
  const addTemplateField = useCallback(
    (patch: Partial<DraftField>) => setFields((p) => [...p, { ...emptyField(), ...patch }]),
    [],
  )
  const removeField = useCallback((u: string) => setFields((p) => p.filter((f) => f._uid !== u)), [])
  const moveField = useCallback((idx: number, dir: 1 | -1) => {
    setFields((p) => { const a = [...p]; [a[idx], a[idx + dir]] = [a[idx + dir], a[idx]]; return a })
  }, [])

  const addOutput = useCallback(() => setOutputs((p) => [...p, emptyOutput()]), [])
  const removeOutput = useCallback((u: string) => setOutputs((p) => p.filter((o) => o._uid !== u)), [])
  const moveOutput = useCallback((idx: number, dir: 1 | -1) => {
    setOutputs((p) => { const a = [...p]; [a[idx], a[idx + dir]] = [a[idx + dir], a[idx]]; return a })
  }, [])

  /**
   * Create a missing input straight from the formula editor. This is what stops
   * a formula naming something that doesn't exist — the bug that put
   * "Unknown variable 'clamp_force'" on the live cycle-time page.
   */
  const createInputFromFormula = useCallback((label: string): string => {
    const key = uniqueKey(label, new Set(fields.map((f) => f.field_key)))
    setFields((p) => [...p, { ...emptyField(), label, field_key: key, default_value: "1" }])
    toast.success(`Added "${label}" to your inputs`)
    return key
  }, [fields])

  /** Repair a dangling variable by creating the input it names, key and all. */
  const createInputForKey = useCallback((key: string) => {
    const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    setFields((p) => [...p, { ...emptyField(), label, field_key: key, default_value: "1" }])
    toast.success(`Added "${label}" to your inputs`)
  }, [])

  // ── Tables ⇄ picker fields ─────────────────────────────────────────────────

  /**
   * A picker table is backed by a real select field. Editing the table rewrites
   * that field's choices; ticking the box creates the field, unticking drops it.
   */
  const handleTables = useCallback((next: DraftTable[]) => {
    setTables(next)
    setFields((prev) => {
      let list = [...prev]
      for (const t of next) {
        if (!t.pickerFieldUid) continue
        const options = tableToOptionsJson(t)
        const found = list.find((f) => f._uid === t.pickerFieldUid)
        if (found) {
          list = list.map((f) => f._uid === t.pickerFieldUid
            ? { ...f, options_text: options, label: f.label || t.title, show_reference: false }
            : f)
        } else {
          list = [...list, {
            ...emptyField(),
            _uid: t.pickerFieldUid,
            label: t.title || "Choice",
            field_key: uniqueKey(t.title || "choice", new Set(list.map((f) => f.field_key))),
            field_type: "select",
            options_text: options,
            show_reference: false,
          }]
        }
      }
      // Unticked tables lose their field.
      const liveUids = new Set(next.filter((t) => t.pickerFieldUid).map((t) => t.pickerFieldUid))
      const droppedUids = new Set(
        tables.filter((t) => t.pickerFieldUid && !liveUids.has(t.pickerFieldUid)).map((t) => t.pickerFieldUid),
      )
      return list.filter((f) => !droppedUids.has(f._uid))
    })
  }, [tables])

  // ── Derived ────────────────────────────────────────────────────────────────

  const samples = useMemo(() => sampleValues(fields), [fields])

  const knownKeys = useMemo(
    () => new Set([
      ...fields.map((f) => f.field_key).filter(Boolean),
      ...presetVarKeys(fields),
      ...outputs.map((o) => o.output_key).filter(Boolean),
    ]),
    [fields, outputs],
  )

  /** What the `+ Input` menu offers, by label — never by key. */
  const formulaVars = useMemo<VarOption[]>(() => {
    const out: VarOption[] = []
    for (const f of fields) {
      if (!f.field_key) continue
      if (f.field_type === "select") continue // its columns are the numbers, not it
      out.push({ key: f.field_key, label: f.label || f.field_key, group: "Inputs" })
    }
    for (const t of tables) {
      const [, ...valueCols] = t.columns
      for (const c of valueCols) {
        if (c.key) out.push({ key: c.key, label: `${c.label || c.key} (${t.title || "table"})`, group: "Table values" })
      }
    }
    // Preset keys from legacy fields the tables didn't cover.
    for (const k of presetVarKeys(fields)) {
      if (!out.some((v) => v.key === k)) out.push({ key: k, label: k, group: "Table values" })
    }
    for (const o of outputs) {
      if (o.output_key) out.push({ key: o.output_key, label: o.label || o.output_key, group: "Earlier results" })
    }
    return out
  }, [fields, outputs, tables])

  /**
   * Sample scope for each result, with every earlier result folded in — results
   * chain at runtime, so a Total built from four earlier ones has to evaluate
   * here the same way or the builder invents errors that don't exist.
   */
  const sampleScopes = useMemo(() => {
    const scopes = new Map<string, Record<string, number>>()
    const scope: Record<string, number> = { ...samples }
    for (const o of outputs) {
      scopes.set(o._uid, { ...scope })
      const r = evaluateFormula(o.formula, scope)
      if (typeof r.value === "number" && o.output_key) scope[o.output_key] = r.value
    }
    return scopes
  }, [outputs, samples])

  /** Problems, keyed by card, so each one shows where it can be fixed. */
  const problems = useMemo(() => {
    const byField = new Map<string, string>()
    const byOutput = new Map<string, string>()
    const missingByOutput = new Map<string, string[]>()
    const general: string[] = []

    if (!title.trim()) general.push("Add a title on the Details step")
    if (!slug.trim()) general.push("Add a URL slug on the Details step")
    if (fields.length === 0) general.push("Add at least one input")
    if (outputs.length === 0) general.push("Add at least one result")

    for (const f of fields) {
      if (!f.label.trim()) byField.set(f._uid, "This input needs a label.")
    }
    for (const o of outputs) {
      if (!o.label.trim()) { byOutput.set(o._uid, "This result needs a label."); continue }
      if (!o.formula.trim()) { byOutput.set(o._uid, "This result needs a formula."); continue }
      const missing = missingVars(o.formula, knownKeys)
      if (missing.length) {
        missingByOutput.set(o._uid, missing)
        byOutput.set(o._uid, `This formula uses something that doesn't exist yet.`)
        continue
      }
      const r = evaluateFormula(o.formula, sampleScopes.get(o._uid) ?? samples)
      if (r.error) byOutput.set(o._uid, r.error)
    }
    return { byField, byOutput, missingByOutput, general, count: byField.size + byOutput.size + general.length }
  }, [title, slug, fields, outputs, knownKeys, samples, sampleScopes])

  const stepProblems = useMemo(() => [
    problems.general.filter((g) => g.includes("Details")).length,
    problems.byField.size + (fields.length === 0 ? 1 : 0),
    problems.byOutput.size + (outputs.length === 0 ? 1 : 0),
    0,
  ], [problems, fields.length, outputs.length])

  // ── Preview ────────────────────────────────────────────────────────────────

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
      // Prefill so the preview computes instead of asking to fill the form.
      default_value: f.default_value || defaultSample(f),
      options: parseOptions(f.options_text),
      units: unitsToDb(f.units), show_reference: f.show_reference,
      field_group: f.field_group || null, sort_order: i, created_at: "",
    })),
    outputs: outputs.map((o, i): CalcOutput => ({
      id: o._uid, calculator_id: "preview",
      label: o.label || "Result", output_key: o.output_key || `out_${i + 1}`,
      formula: o.formula || "0", unit: o.unit || null, units: unitsToDb(o.units),
      decimals: o.decimals, description: o.description || null, sort_order: i, created_at: "",
    })),
    referenceTables: tables.map((t, i) => ({
      id: t._uid, calculator_id: "preview", ...tableToDb(t), sort_order: i, created_at: "",
    })),
  }), [title, slug, shortDesc, fields, outputs, tables, unitSystems])

  const previewKey = useMemo(() =>
    fields.map((f) => `${f.field_key}|${f.field_type}|${f.default_value}|${f.options_text}`).join("~")
    + "#" + outputs.map((o) => `${o.output_key}=${o.formula}|${o.decimals}`).join("~")
    + "#" + unitSystems.map((u) => u.key).join(","),
    [fields, outputs, unitSystems])

  // ── Save ───────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!title.trim()) { toast.error("Title is required"); setStep(0); return }
    if (!slug.trim()) { toast.error("Slug is required"); setStep(0); return }
    if (isPublished && problems.count > 0) {
      toast.error("Fix the highlighted problems before publishing")
      return
    }

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

  function applyTemplate(key: string) {
    const tpl = TEMPLATES[key]
    if (!tpl) return
    setTitle(tpl.title)
    setSlug(makeSlug(tpl.title))
    setShortDesc(tpl.description)
    const nextFields = tpl.fields.map((f) => ({ ...emptyField(), ...f, _uid: uid() }))
    setFields(nextFields)
    setOutputs(tpl.outputs.map((o) => ({ ...emptyOutput(), ...o, _uid: uid() })))
    setTables(
      nextFields
        .filter((f) => f.field_type === "select" && (parseOptions(f.options_text) ?? []).some((o) => o.values))
        .map(optionsToTable),
    )
    setStarted(true)
    setStep(1)
    toast.success(`Started from "${tpl.title}"`)
  }

  // ── Opening screen ─────────────────────────────────────────────────────────

  if (!started) {
    return (
      <StartScreen
        existing={existing}
        onTemplate={applyTemplate}
        onScratch={() => setStarted(true)}
        onDuplicate={(id) => router.push(`/dashboard/calculators/${id}/edit`)}
      />
    )
  }

  const isLast = step === STEP_META.length - 1

  const editor = (
    <div className="space-y-5">
      <Stepper current={step} counts={[undefined, fields.length, outputs.length, undefined]} problems={stepProblems} onGo={setStep} />

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
        />
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-500">The boxes people fill in before they get a result.</p>
            <button type="button" onClick={addField} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
              <Plus className="size-4" /> Add input
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400">Ready-made:</span>
            {FIELD_TEMPLATES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => addTemplateField(t.build())}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="size-3.5" /> {t.label}
              </button>
            ))}
          </div>

          {fields.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-zinc-200 py-12 text-center">
              <FlaskConical className="mx-auto mb-2 size-8 text-zinc-200" />
              <p className="text-sm text-zinc-400">No inputs yet. Add your first one.</p>
            </div>
          )}

          {fields
            .filter((f) => f.field_type !== "select" || !tables.some((t) => t.pickerFieldUid === f._uid))
            .map((field) => {
              const idx = fields.indexOf(field)
              return (
                <FieldCard
                  key={field._uid}
                  field={field}
                  unitSystems={unitSystems}
                  idx={idx}
                  total={fields.length}
                  problem={problems.byField.get(field._uid)}
                  onUpdate={updateField}
                  onRemove={removeField}
                  onMove={moveField}
                />
              )
            })}

          <div className="border-t border-zinc-200 pt-5">
            <DataTables tables={tables} onChange={handleTables} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-500">
              What the tool works out. Build each formula by clicking — results compute top to
              bottom, so a later one can use an earlier one.
            </p>
            <button type="button" onClick={addOutput} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
              <Plus className="size-4" /> Add result
            </button>
          </div>

          {outputs.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-zinc-200 py-12 text-center">
              <Zap className="mx-auto mb-2 size-8 text-zinc-200" />
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
              vars={formulaVars.filter((v) => v.group !== "Earlier results" || v.key !== output.output_key)}
              sampleVars={sampleScopes.get(output._uid) ?? samples}
              problem={problems.byOutput.get(output._uid)}
              missing={problems.missingByOutput.get(output._uid)}
              onCreateMissing={createInputForKey}
              onUpdate={updateOutput}
              onRemove={removeOutput}
              onMove={moveOutput}
              onCreateInput={createInputFromFormula}
            />
          ))}
        </div>
      )}

      {step === 3 && (
        <StepPublish
          problems={problems}
          isPublished={isPublished} onPublished={setIsPublished}
          isFeatured={isFeatured} onFeatured={setIsFeatured}
          sortOrder={sortOrder} onSortOrder={setSortOrder}
          seoTitle={seoTitle} onSeoTitle={setSeoTitle}
          seoDesc={seoDesc} onSeoDesc={setSeoDesc}
          onGo={setStep}
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-5">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 lg:hidden"
          >
            <Eye className="size-4" /> Preview
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          {isLast ? (
            <button
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
            >
              <Check className="size-4" />
              {isPending ? "Saving…" : calculator ? "Save changes" : "Create tool"}
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => Math.min(STEP_META.length - 1, s + 1))}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Next <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  const preview = (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Eye className="size-4 text-primary" />
        <p className="text-sm font-bold text-zinc-900">Live preview</p>
      </div>
      {fields.length === 0 && outputs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white py-12 text-center">
          <Eye className="mx-auto mb-2 size-7 text-zinc-200" />
          <p className="text-sm text-zinc-400">Your tool appears here as you build it.</p>
        </div>
      ) : (
        <CalculatorRunner key={previewKey} calculator={previewCalc} preview />
      )}
    </div>
  )

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="min-w-0">{editor}</div>
        {/* Docked beside the editor, so the effect of every edit is visible. */}
        <div className="hidden lg:block">
          <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">{preview}</div>
        </div>
      </div>

      <Drawer open={previewOpen} onClose={() => setPreviewOpen(false)} title="Live preview">
        {preview}
      </Drawer>
    </>
  )
}

/** Prefills the preview so it computes straight away. */
function defaultSample(f: DraftField): string {
  if (f.field_type === "select") return (parseOptions(f.options_text) ?? [])[0]?.value ?? ""
  if (f.field_type === "checkbox") return "1"
  if (f.field_type === "text") return ""
  return f.min_value || "1"
}

// ── Start screen ─────────────────────────────────────────────────────────────

function StartScreen({ existing, onTemplate, onScratch, onDuplicate }: {
  existing: { id: string; title: string }[]
  onTemplate: (key: string) => void
  onScratch: () => void
  onDuplicate: (id: string) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-base font-bold text-zinc-900">
          <Sparkles className="size-4 text-primary" /> Start from a ready-made tool
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Everything is editable afterwards — this just saves you building it from nothing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(TEMPLATES).map(([key, tpl]) => (
          <button
            key={key}
            onClick={() => onTemplate(key)}
            className="rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
          >
            <p className="text-sm font-semibold text-zinc-900">{tpl.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{tpl.description}</p>
            <p className="mt-2 text-[11px] text-zinc-400">
              {tpl.fields.length} input{tpl.fields.length !== 1 ? "s" : ""} · {tpl.outputs.length} result{tpl.outputs.length !== 1 ? "s" : ""}
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-5">
        <button
          onClick={onScratch}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          <FileText className="size-4" /> Start from scratch
        </button>

        {existing.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-zinc-500">
            <Copy className="size-4 text-zinc-400" />
            Or copy an existing tool:
            <select
              defaultValue=""
              onChange={(e) => e.target.value && onDuplicate(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— pick one —</option>
              {existing.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
        )}
      </div>
    </div>
  )
}

// ── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ current, counts, problems, onGo }: {
  current: number
  counts: (number | undefined)[]
  problems: number[]
  onGo: (n: number) => void
}) {
  return (
    <div className="flex items-center">
      {STEP_META.map(({ label, icon: Icon }, i) => {
        const active = i === current
        const bad = problems[i] > 0
        const count = counts[i]
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <button type="button" onClick={() => onGo(i)} className="group flex items-center gap-2.5">
              <span className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                active ? "border-primary bg-primary text-white"
                  : bad ? "border-red-300 bg-red-50 text-red-600"
                  : "border-zinc-300 bg-white text-zinc-400 group-hover:border-zinc-400",
              )}>
                {bad && !active ? <AlertTriangle className="size-4" /> : <Icon className="size-4" />}
              </span>
              <span className="hidden text-left sm:block">
                <span className={cn("block text-sm font-semibold leading-tight", active ? "text-zinc-900" : "text-zinc-500")}>
                  {label}
                  {count !== undefined && count > 0 && <span className="ml-1 text-xs font-normal text-zinc-400">({count})</span>}
                </span>
                <span className={cn("block text-[11px]", bad ? "font-medium text-red-500" : "text-zinc-400")}>
                  {bad ? `${problems[i]} to fix` : `Step ${i + 1}`}
                </span>
              </span>
            </button>
            {i < STEP_META.length - 1 && <span className="mx-3 h-px min-w-4 flex-1 bg-zinc-200" />}
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
}) {
  return (
    <div className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6">
      <div>
        <Label required>Title</Label>
        <Input value={props.title} onChange={(e) => props.onTitle(e.target.value)} placeholder="e.g. Injection Molding Cycle Time" />
      </div>
      <div>
        <Label>Short description</Label>
        <Input value={props.shortDesc} onChange={(e) => props.onShortDesc(e.target.value)} placeholder="One line, shown on cards and under the title" />
      </div>
      <div>
        <Label>Category</Label>
        <Select value={props.categoryId} onChange={(e) => props.onCategory(e.target.value)}>
          <option value="">— No category —</option>
          {props.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
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
        <p className="mt-1 text-xs text-zinc-400">
          Optional. One image is centred above the tool; several become a gallery.
        </p>
      </div>

      <div>
        <Label>Unit switcher</Label>
        {props.unitSystems.length === 0 ? (
          <button
            type="button"
            onClick={() => props.onUnitSystems(DEFAULT_UNIT_SYSTEMS)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="size-4" /> Offer Metric and Imperial
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
            <button type="button" onClick={() => props.onUnitSystems([])} className="text-xs text-zinc-400 transition-colors hover:text-red-600">
              Remove the unit switcher
            </button>
          </div>
        )}
        <p className="mt-1 text-xs text-zinc-400">
          Optional. Turn this on and each input and result can offer both systems — you pick the
          units, the conversion is handled for you.
        </p>
      </div>

      <Advanced>
        <div>
          <FieldLabel hint="the page address">URL slug</FieldLabel>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-xs text-zinc-400">/tools/</span>
            <Input value={props.slug} onChange={(e) => props.onSlug(e.target.value)} className="font-mono" />
          </div>
        </div>
        <div>
          <FieldLabel hint="the “About this calculator” box">Full description</FieldLabel>
          <RichTextEditor
            value={toDoc(props.description)}
            onChange={(v) => props.onDescription(fromDoc(v))}
            placeholder="Detailed explanation, formula notes, assumptions…"
            minHeight={180}
          />
        </div>
      </Advanced>
    </div>
  )
}

// ── Step 4: Publish ──────────────────────────────────────────────────────────

function StepPublish(props: {
  problems: {
    general: string[]
    byField: Map<string, string>
    byOutput: Map<string, string>
    missingByOutput: Map<string, string[]>
    count: number
  }
  isPublished: boolean; onPublished: (v: boolean) => void
  isFeatured: boolean; onFeatured: (v: boolean) => void
  sortOrder: string; onSortOrder: (v: string) => void
  seoTitle: string; onSeoTitle: (v: string) => void
  seoDesc: string; onSeoDesc: (v: string) => void
  onGo: (n: number) => void
}) {
  const ready = props.problems.count === 0
  return (
    <div className="space-y-5">
      <div className={cn("rounded-xl border p-5", ready ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
        <div className="mb-2 flex items-center gap-2">
          {ready ? <CheckCircle2 className="size-5 text-emerald-600" /> : <AlertTriangle className="size-5 text-amber-600" />}
          <p className={cn("text-sm font-bold", ready ? "text-emerald-800" : "text-amber-800")}>
            {ready ? "Ready to publish" : `${props.problems.count} thing${props.problems.count > 1 ? "s" : ""} to fix first`}
          </p>
        </div>
        {ready ? (
          <p className="text-sm text-emerald-700">Turn on Published below and save.</p>
        ) : (
          <>
            <ul className="space-y-1 text-sm text-amber-800">
              {props.problems.general.map((g, i) => <li key={i} className="flex gap-2"><span>•</span><span>{g}</span></li>)}
              {props.problems.byField.size > 0 && (
                <li className="flex gap-2"><span>•</span><span>{props.problems.byField.size} input(s) need attention — they&rsquo;re marked in red.</span></li>
              )}
              {props.problems.byOutput.size > 0 && (
                <li className="flex gap-2"><span>•</span><span>{props.problems.byOutput.size} result(s) need attention — they&rsquo;re marked in red.</span></li>
              )}
            </ul>
            <div className="mt-3 flex gap-2">
              <button onClick={() => props.onGo(1)} className="text-xs font-medium text-amber-800 underline hover:no-underline">Go to Inputs</button>
              <button onClick={() => props.onGo(2)} className="text-xs font-medium text-amber-800 underline hover:no-underline">Go to Results</button>
            </div>
          </>
        )}
      </div>

      <div className="space-y-3">
        <Toggle label="Published" hint="Visible on the public Engineering page" checked={props.isPublished} onChange={props.onPublished} />
        <Toggle label="Featured" hint="Highlighted at the top of the tools list" checked={props.isFeatured} onChange={props.onFeatured} />
      </div>

      <Advanced>
        <div>
          <FieldLabel hint="lower shows first">Sort order</FieldLabel>
          <Input type="number" value={props.sortOrder} onChange={(e) => props.onSortOrder(e.target.value)} className="max-w-32" />
        </div>
        <div>
          <FieldLabel>SEO title</FieldLabel>
          <Input value={props.seoTitle} onChange={(e) => props.onSeoTitle(e.target.value)} placeholder="Defaults to the title" />
        </div>
        <div>
          <FieldLabel>SEO description</FieldLabel>
          <Textarea value={props.seoDesc} onChange={(e) => props.onSeoDesc(e.target.value)} rows={2} placeholder="Defaults to the short description" />
        </div>
      </Advanced>
    </div>
  )
}
