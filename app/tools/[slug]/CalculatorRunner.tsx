"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { AlertCircle, RotateCcw, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CalculatorWithRelations, CalcField } from "@/types/calculator"
import { evaluateFormula } from "@/lib/formula-engine"
import { recordRun } from "@/services/calculator.service"

interface Props {
  calculator: CalculatorWithRelations
}

export default function CalculatorRunner({ calculator }: Props) {
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

  function reset() { setValues(initialValues); runTracked.current = false }

  // Parse numeric values — invalid = NaN
  const numericValues = useMemo(() => {
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(values)) {
      out[k] = v === "" ? NaN : parseFloat(v)
    }
    return out
  }, [values])

  // Check all required fields filled
  const allFilled = useMemo(() =>
    calculator.fields
      .filter((f) => f.is_required)
      .every((f) => values[f.field_key] !== "" && !isNaN(numericValues[f.field_key])),
    [calculator.fields, values, numericValues]
  )

  // Compute outputs
  const results = useMemo(() => {
    if (!allFilled) return null
    return calculator.outputs.map((o) => {
      const r = evaluateFormula(o.formula, numericValues)
      return { output: o, result: r }
    })
  }, [allFilled, calculator.outputs, numericValues])

  // Track run once results are computed
  useEffect(() => {
    if (!results || runTracked.current) return
    const hasError = results.some((r) => "error" in r.result)
    if (hasError) return
    runTracked.current = true
    const inputs = Object.fromEntries(calculator.fields.map((f) => [f.field_key, numericValues[f.field_key]]))
    const outputs = Object.fromEntries(results.map(({ output, result }) => [output.output_key, "value" in result ? result.value : null]))
    recordRun(calculator.id, inputs, outputs).catch(() => {})
  }, [results, calculator, numericValues])

  const setValue = useCallback((key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }))
    runTracked.current = false
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Left: Inputs ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900">Inputs</h2>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <RotateCcw className="size-3.5" /> Reset
          </button>
        </div>

        {calculator.fields.length === 0 ? (
          <p className="text-sm text-zinc-400">This calculator has no input fields.</p>
        ) : (
          calculator.fields.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={values[field.field_key] ?? ""}
              onChange={(v) => setValue(field.field_key, v)}
            />
          ))
        )}
      </div>

      {/* ── Right: Results ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-primary" />
          <h2 className="text-base font-bold text-zinc-900">Results</h2>
        </div>

        {!allFilled ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
              <Zap className="size-5 text-zinc-300" />
            </div>
            <p className="text-sm font-medium text-zinc-400">Fill in all required fields</p>
            <p className="text-xs text-zinc-300 mt-1">Results will appear automatically</p>
          </div>
        ) : calculator.outputs.length === 0 ? (
          <p className="text-sm text-zinc-400">No outputs defined for this calculator.</p>
        ) : (
          <div className="space-y-4">
            {results?.map(({ output, result }) => (
              <div key={output.id} className={cn(
                "rounded-xl p-4 border",
                "error" in result ? "border-red-200 bg-red-50" : "border-primary/20 bg-primary/5"
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{output.label}</p>
                    {"error" in result ? (
                      <div className="flex items-center gap-1.5 mt-1 text-red-600">
                        <AlertCircle className="size-4 shrink-0" />
                        <p className="text-sm">{result.error}</p>
                      </div>
                    ) : (
                      <p className="text-3xl font-black text-zinc-900 mt-1 leading-none">
                        {result.value.toFixed(output.decimals)}
                        {output.unit && <span className="text-base font-medium text-zinc-500 ml-2">{output.unit}</span>}
                      </p>
                    )}
                    {output.description && (
                      <p className="text-xs text-zinc-400 mt-1.5">{output.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── FieldInput ─────────────────────────────────────────────────────────────────

function FieldInput({ field, value, onChange }: { field: CalcField; value: string; onChange: (v: string) => void }) {
  const baseClass = "w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-800">
        {field.label}
        {field.unit && <span className="ml-1 text-xs text-zinc-400">({field.unit})</span>}
        {field.is_required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      {field.field_type === "select" && field.options ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={baseClass + " bg-white"}>
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
          <span className="text-sm text-zinc-700">{field.placeholder || "Yes"}</span>
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
          <div className="flex justify-between text-xs text-zinc-400">
            <span>{field.min_value ?? 0}</span>
            <span className="font-semibold text-zinc-700">{value || (field.min_value ?? 0)}{field.unit ? ` ${field.unit}` : ""}</span>
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
        <p className="text-xs text-zinc-400">{field.help_text}</p>
      )}
    </div>
  )
}
