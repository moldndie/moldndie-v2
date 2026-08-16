"use client"

import { useState, useMemo, useCallback, useEffect, useRef, createContext, useContext } from "react"
import { AlertCircle, RotateCcw, Zap, Table2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  CalculatorWithRelations,
  CalcField,
  CalcReferenceColumn,
} from "@/types/calculator"
import { evaluateFormula } from "@/lib/formula-engine"
import { unitFor, toBase, fromBase } from "@/lib/units"
import { recordRun } from "@/services/calculator.service"

/**
 * The public tool pages are dark; the dashboard live preview sits on a light
 * panel and renders the same component. Context rather than a drilled prop —
 * five nested components would otherwise each need to pass it on.
 */
const DarkCtx = createContext(false)
const useDark = () => useContext(DarkCtx)

interface Props {
  calculator: CalculatorWithRelations
  /** When true, render for the dashboard live preview: never records runs. */
  preview?: boolean
  /** Public tool pages pass "dark"; the builder keeps the light default. */
  theme?: "light" | "dark"
}

// A field is "filled" when it holds a usable value. Numeric-style fields must
// parse to a finite number; other field types just need to be non-empty.
function isFilled(field: CalcField, value: string, numeric: number): boolean {
  if (field.field_type === "checkbox") return true // always 0 or 1
  if (field.field_type === "number" || field.field_type === "range") {
    return value !== "" && !isNaN(numeric)
  }
  return value !== "" // select / text
}

export default function CalculatorRunner({ calculator, preview = false, theme = "light" }: Props) {
  const dark = theme === "dark"
  // Build initial values from defaults or empty string
  const initialValues = useMemo(() => {
    const init: Record<string, string> = {}
    for (const f of calculator.fields) {
      init[f.field_key] = f.default_value ?? ""
    }
    return init
  }, [calculator.fields])

  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const runTracked = useRef(false)

  const unitSystems = calculator.unit_systems ?? []
  const [system, setSystem] = useState<string | null>(unitSystems[0]?.key ?? null)

  function reset() { setValues(initialValues); runTracked.current = false }

  // Assemble the numeric variable scope from raw inputs, then merge in the
  // values carried by any selected `select` option (material-preset lookup).
  const numericValues = useMemo(() => {
    const out: Record<string, number> = {}
    const byKey = new Map(calculator.fields.map((f) => [f.field_key, f]))
    for (const [k, v] of Object.entries(values)) {
      const raw = v === "" ? NaN : parseFloat(v)
      // Into the base system, so the formula never has to know which one is on.
      out[k] = toBase(raw, unitFor(byKey.get(k)?.units, system, null))
    }
    for (const f of calculator.fields) {
      if (f.field_type !== "select" || !f.options) continue
      const opt = f.options.find((o) => o.value === values[f.field_key])
      if (opt?.values) Object.assign(out, opt.values)
    }
    return out
  }, [values, calculator.fields, system])

  // Check all required fields filled
  const allFilled = useMemo(() =>
    calculator.fields
      .filter((f) => f.is_required)
      .every((f) => isFilled(f, values[f.field_key] ?? "", numericValues[f.field_key] ?? NaN)),
    [calculator.fields, values, numericValues]
  )

  // Compute outputs in order, feeding each successful result back into the
  // scope so later outputs can reference earlier ones by their output_key.
  const results = useMemo(() => {
    if (!allFilled) return null
    const scope: Record<string, number> = { ...numericValues }
    return calculator.outputs.map((o) => {
      const r = evaluateFormula(o.formula, scope)
      if (typeof r.value === "number") scope[o.output_key] = r.value
      return { output: o, result: r }
    })
  }, [allFilled, calculator.outputs, numericValues])

  // Track run once results are computed
  useEffect(() => {
    if (preview) return
    if (!results || runTracked.current) return
    const hasError = results.some((r) => "error" in r.result)
    if (hasError) return
    runTracked.current = true
    const inputs = Object.fromEntries(calculator.fields.map((f) => [f.field_key, numericValues[f.field_key]]))
    const outputs = Object.fromEntries(results.map(({ output, result }) => [output.output_key, "value" in result ? result.value : null]))
    recordRun(calculator.id, inputs, outputs).catch(() => {})
  }, [results, calculator, numericValues, preview])

  const setValue = useCallback((key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }))
    runTracked.current = false
  }, [])

  // Group fields by field_group, preserving order. Ungrouped fields come first
  // under no heading; grouped fields render under their heading.
  const groups = useMemo(() => {
    const order: string[] = []
    const map = new Map<string, CalcField[]>()
    for (const f of calculator.fields) {
      const key = f.field_group?.trim() || ""
      if (!map.has(key)) { map.set(key, []); order.push(key) }
      map.get(key)!.push(f)
    }
    return order.map((key) => ({ name: key, fields: map.get(key)! }))
  }, [calculator.fields])

  // Two sources, one shape: preset dropdowns still publish their value maps as
  // a table, and standalone tables come straight from the database.
  const referenceTables = useMemo<NormalizedTable[]>(() => {
    const derived = calculator.fields
      .filter((f) => f.field_type === "select" && f.show_reference !== false && f.options?.some((o) => o.values))
      .map((f): NormalizedTable => {
        const cols: string[] = []
        for (const o of f.options ?? []) {
          for (const k of Object.keys(o.values ?? {})) if (!cols.includes(k)) cols.push(k)
        }
        return {
          id: f.id,
          title: `${f.label} — Reference Values`,
          category: null,
          columns: [{ key: "__option", label: f.label }, ...cols.map((c) => ({ key: c, label: c }))],
          rows: (f.options ?? []).map((o) => ({
            __option: o.label,
            ...Object.fromEntries(Object.entries(o.values ?? {}).map(([k, v]) => [k, String(v)])),
          })),
        }
      })

    const stored = (calculator.referenceTables ?? []).map((t): NormalizedTable => ({
      id: t.id,
      title: t.title,
      category: t.category,
      columns: t.columns ?? [],
      rows: t.rows ?? [],
    }))

    return [...stored, ...derived]
  }, [calculator.fields, calculator.referenceTables])

  return (
    <DarkCtx.Provider value={dark}>
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Inputs ────────────────────────────────────────────────────── */}
        <div className={cn(CARD(dark), "space-y-5")}>
          <div className="flex items-center justify-between">
            <h2 className={cn("text-base font-bold", HEADING(dark))}>Inputs</h2>
            <button
              onClick={reset}
              className={cn("flex items-center gap-1.5 text-xs transition-colors", dark ? "text-[var(--calc-muted)] hover:text-[var(--calc-text)]" : "text-zinc-400 hover:text-zinc-700")}
            >
              <RotateCcw className="size-3.5" /> Reset
            </button>
          </div>

          {unitSystems.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("text-xs font-semibold uppercase tracking-widest", MUTED_TEXT(dark))}>Unit system</span>
              <div className={cn("flex rounded-lg border p-0.5", dark ? "border-[var(--calc-border)]" : "border-zinc-200")}>
                {unitSystems.map((u) => (
                  <button
                    key={u.key}
                    type="button"
                    onClick={() => setSystem(u.key)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                      system === u.key
                        ? "bg-primary text-white"
                        : dark ? "text-[var(--calc-muted)] hover:text-[var(--calc-text)]" : "text-zinc-500 hover:text-zinc-800",
                    )}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {calculator.fields.length === 0 ? (
            <p className={cn("text-sm", MUTED_TEXT(dark))}>This calculator has no input fields.</p>
          ) : (
            groups.map((group) => (
              <div key={group.name || "_ungrouped"} className="space-y-5">
                {group.name && (
                  <p className={cn("text-xs font-bold uppercase tracking-widest pt-1", MUTED_TEXT(dark))}>{group.name}</p>
                )}
                {group.fields.map((field) => (
                  <FieldInput
                    key={field.id}
                    field={field}
                    system={system}
                    value={values[field.field_key] ?? ""}
                    onChange={(v) => setValue(field.field_key, v)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* ── Right: Results ───────────────────────────────────────────────────── */}
        <div className={cn(CARD(dark), "space-y-5")}>
          <div className="flex items-center gap-2">
            <Zap className={cn("size-4", dark ? "text-[var(--calc-accent)]" : "text-primary")} />
            <h2 className={cn("text-base font-bold", HEADING(dark))}>Results</h2>
          </div>

          {!allFilled ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className={cn("size-12 rounded-full flex items-center justify-center mb-3", dark ? "bg-[var(--calc-surface-3)]" : "bg-zinc-100")}>
                <Zap className={cn("size-5", dark ? "text-[var(--calc-muted)]" : "text-zinc-300")} />
              </div>
              <p className={cn("text-sm font-medium", MUTED_TEXT(dark))}>Fill in all required fields</p>
              <p className={cn("text-xs mt-1", dark ? "text-[var(--calc-muted)] opacity-70" : "text-zinc-300")}>Results will appear automatically</p>
            </div>
          ) : calculator.outputs.length === 0 ? (
            <p className={cn("text-sm", MUTED_TEXT(dark))}>No outputs defined for this calculator.</p>
          ) : (
            <div className="space-y-4">
              {results?.map(({ output, result }) => {
                const ou = unitFor(output.units, system, output.unit)
                return (
                <div key={output.id} className={cn(
                  "rounded-xl p-4 border",
                  "error" in result
                    ? dark ? "border-red-500/40 bg-red-500/10" : "border-red-200 bg-red-50"
                    : dark ? "border-[var(--calc-border)] bg-[var(--calc-surface-3)]" : "border-primary/20 bg-primary/5"
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn("text-xs font-semibold uppercase tracking-widest", dark ? "text-[var(--calc-muted)]" : "text-zinc-500")}>{output.label}</p>
                      {"error" in result ? (
                        <div className="flex items-center gap-1.5 mt-1 text-red-600">
                          <AlertCircle className="size-4 shrink-0" />
                          <p className="text-sm">{result.error}</p>
                        </div>
                      ) : (
                        <p className={cn("text-4xl font-black mt-1 leading-none tracking-tight", dark ? "text-[var(--calc-accent)]" : "text-zinc-900")}>
                          {fromBase(result.value, ou).toFixed(output.decimals)}
                          {ou.unit && <span className={cn("text-base font-medium ml-2", dark ? "text-[var(--calc-muted)]" : "text-zinc-500")}>{ou.unit}</span>}
                        </p>
                      )}
                      {output.description && (
                        <p className={cn("text-xs mt-1.5", MUTED_TEXT(dark))}>{output.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <ReferenceTables tables={referenceTables} />
    </div>
    </DarkCtx.Provider>
  )
}

/** Card, heading and muted-text treatments for the two themes. */
/* On dark the runner sits inside one maroon card, so its panels are inset
   surfaces rather than free-floating white cards. --calc-* tokens: globals.css */
const CARD = (dark: boolean) =>
  dark
    ? "rounded-2xl border border-[var(--calc-border)] bg-[var(--calc-surface-2)] p-6"
    : "rounded-2xl border border-zinc-200 bg-white p-6"
const HEADING = (dark: boolean) => (dark ? "text-[var(--calc-text)]" : "text-zinc-900")
const MUTED_TEXT = (dark: boolean) => (dark ? "text-[var(--calc-muted)]" : "text-zinc-400")

// ── Reference tables ───────────────────────────────────────────────────────────
// One renderer for both sources — preset dropdowns and standalone tables. Search
// spans every cell; the category chips only appear once there is more than one.

interface NormalizedTable {
  id: string
  title: string
  category: string | null
  columns: CalcReferenceColumn[]
  rows: Record<string, string>[]
}

function ReferenceTables({ tables }: { tables: NormalizedTable[] }) {
  const dark = useDark()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string | null>(null)

  const categories = useMemo(() => {
    const seen: string[] = []
    for (const t of tables) if (t.category && !seen.includes(t.category)) seen.push(t.category)
    return seen
  }, [tables])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tables
      .filter((t) => !category || t.category === category)
      .map((t) => ({
        ...t,
        rows: q
          ? t.rows.filter((r) => Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q)))
          : t.rows,
      }))
      // A table with nothing left to show is noise while searching.
      .filter((t) => t.columns.length > 0 && (!q || t.rows.length > 0))
  }, [tables, query, category])

  if (tables.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className={cn("pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2", MUTED_TEXT(dark))} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reference values…"
            className={cn(
              "w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
              dark
                ? "border-[var(--calc-border)] bg-[var(--calc-surface)] text-[var(--calc-text)] placeholder:text-[var(--calc-muted)]"
                : "border-zinc-200",
            )}
          />
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <CategoryChip active={category === null} onClick={() => setCategory(null)}>All</CategoryChip>
            {categories.map((c) => (
              <CategoryChip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c}
              </CategoryChip>
            ))}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <p className={cn(CARD(dark), "text-sm", MUTED_TEXT(dark))}>
          No reference values match “{query}”.
        </p>
      ) : (
        visible.map((t) => <ReferenceTable key={t.id} table={t} />)
      )}
    </div>
  )
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="ui-pill rounded-full border px-3 py-1.5 text-xs font-medium"
    >
      {children}
    </button>
  )
}

function ReferenceTable({ table }: { table: NormalizedTable }) {
  const dark = useDark()
  return (
    <div className={CARD(dark)}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Table2 className={cn("size-4", dark ? "text-[var(--calc-accent)]" : "text-primary")} />
        <h2 className={cn("text-base font-bold", HEADING(dark))}>{table.title}</h2>
        {table.category && (
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", dark ? "bg-[var(--calc-surface-3)] text-[var(--calc-muted)]" : "bg-zinc-100 text-zinc-500")}>
            {table.category}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className={cn("border-b text-left", dark ? "border-[var(--calc-border-strong)]" : "border-zinc-200")}>
              {table.columns.map((c) => (
                <th key={c.key} className={cn("whitespace-nowrap px-4 py-2 font-semibold first:pl-0", dark ? "text-[var(--calc-text)]" : "text-zinc-700")}>
                  {c.label}
                  {c.unit && <span className={cn("ml-1 text-xs font-normal", MUTED_TEXT(dark))}>({c.unit})</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i} className={cn("border-b last:border-0", dark ? "border-[var(--calc-border)]" : "border-zinc-100")}>
                {table.columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-2 tabular-nums first:pl-0 first:font-medium", dark ? "text-[var(--calc-muted)] first:text-[var(--calc-text)]" : "text-zinc-600 first:text-zinc-900")}>
                    {row[c.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── FieldInput ─────────────────────────────────────────────────────────────────

function FieldInput({ field, system, value, onChange }: { field: CalcField; system: string | null; value: string; onChange: (v: string) => void }) {
  const dark = useDark()
  const baseClass = cn(
    "w-full rounded-lg border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
    dark
      ? "border-[var(--calc-border)] bg-[var(--calc-surface)] text-[var(--calc-text)] placeholder:text-[var(--calc-muted)]"
      : "border-zinc-200",
  )
  const { unit } = unitFor(field.units, system, field.unit)

  return (
    <div className="space-y-1.5">
      <label className={cn("block text-xs font-semibold uppercase tracking-widest", dark ? "text-[var(--calc-muted)]" : "text-zinc-800")}>
        {field.label}
        {unit && <span className={cn("ml-1 text-xs", MUTED_TEXT(dark))}>({unit})</span>}
        {field.is_required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      {field.field_type === "select" && field.options ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(baseClass, !dark && "bg-white")}>
          <option value="">— Select —</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : field.field_type === "checkbox" ? (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value === "1"}
            onChange={(e) => onChange(e.target.checked ? "1" : "0")}
            className="rounded"
          />
          <span className={cn("text-sm", dark ? "text-[var(--calc-text)]" : "text-zinc-700")}>{field.placeholder || "Yes"}</span>
        </label>
      ) : field.field_type === "range" ? (
        <div className="space-y-1">
          <input
            type="range"
            min={field.min_value ?? 0}
            max={field.max_value ?? 100}
            step={field.step_value ?? 1}
            value={value || String(field.min_value ?? 0)}
            onChange={(e) => onChange(e.target.value)}
            className="w-full accent-primary"
          />
          <div className={cn("flex justify-between text-xs", MUTED_TEXT(dark))}>
            <span>{field.min_value ?? 0}</span>
            <span className={cn("font-semibold", dark ? "text-[var(--calc-accent)]" : "text-zinc-700")}>{value || (field.min_value ?? 0)}{unit ? ` ${unit}` : ""}</span>
            <span>{field.max_value ?? 100}</span>
          </div>
        </div>
      ) : (
        <input
          type={field.field_type === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? undefined}
          min={field.min_value ?? undefined}
          max={field.max_value ?? undefined}
          step={field.step_value ?? undefined}
          className={baseClass}
        />
      )}

      {field.help_text && (
        <p className={cn("text-xs", MUTED_TEXT(dark))}>{field.help_text}</p>
      )}
    </div>
  )
}
