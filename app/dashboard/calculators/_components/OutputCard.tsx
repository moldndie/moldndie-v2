"use client"

import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Advanced, FieldLabel, Input, Problem, ReorderBtns } from "./ui"
import { UnitsEditor } from "./UnitsEditor"
import FormulaEditor, { type VarOption } from "./FormulaEditor"
import type { DraftOutput } from "./builder-types"
import type { UnitSystem } from "@/types/calculator"

/** One result. The formula is built by clicking; the key is derived. */
export function OutputCard({ output, unitSystems, idx, total, vars, sampleVars, problem, missing, onCreateMissing, onUpdate, onRemove, onMove, onCreateInput }: {
  output: DraftOutput
  unitSystems: UnitSystem[]
  idx: number
  total: number
  vars: VarOption[]
  sampleVars: Record<string, number>
  problem?: string
  /** Variables the formula names that nothing provides. */
  missing?: string[]
  onCreateMissing?: (key: string) => void
  onUpdate: <K extends keyof DraftOutput>(uid: string, key: K, val: DraftOutput[K]) => void
  onRemove: (uid: string) => void
  onMove: (idx: number, dir: 1 | -1) => void
  onCreateInput: (label: string) => string
}) {
  const u = <K extends keyof DraftOutput>(k: K, v: DraftOutput[K]) => onUpdate(output._uid, k, v)

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-white", problem ? "border-red-300" : "border-zinc-200")}>
      <div className="flex items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
        <ReorderBtns idx={idx} total={total} onMove={(d) => onMove(idx, d)} />
        <div className="min-w-0 flex-1">
          <span className="text-sm font-semibold text-zinc-900">
            {output.label || <em className="font-normal text-zinc-400">Untitled result</em>}
          </span>
          {output.unit && <span className="ml-2 text-xs text-zinc-400">{output.unit}</span>}
        </div>
        <button onClick={() => onRemove(output._uid)} className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600">
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="space-y-4 p-4">
        {problem && (
          <Problem>
            {problem}
            {missing?.length && onCreateMissing ? (
              <span className="mt-2 flex flex-wrap gap-1.5">
                {missing.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onCreateMissing(key)}
                    className="rounded-md border border-red-300 bg-white px-2 py-1 text-[11px] font-semibold text-red-700 transition-colors hover:bg-red-100"
                  >
                    Create “{key}” as an input
                  </button>
                ))}
              </span>
            ) : null}
          </Problem>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <FieldLabel>Label *</FieldLabel>
            <Input value={output.label} onChange={(e) => u("label", e.target.value)} placeholder="e.g. Total Cycle Time" />
          </div>
          <div>
            <FieldLabel>Unit</FieldLabel>
            <Input value={output.unit} onChange={(e) => u("unit", e.target.value)} placeholder="s, cm², %…" />
          </div>
        </div>

        <div>
          <FieldLabel>Formula *</FieldLabel>
          <FormulaEditor
            value={output.formula}
            onChange={(v) => u("formula", v)}
            vars={vars}
            sampleVars={sampleVars}
            unit={output.unit}
            onCreateInput={onCreateInput}
          />
        </div>

        <UnitsEditor systems={unitSystems} value={output.units} onChange={(v) => u("units", v)} />

        <Advanced>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel hint="how later formulas refer to this result">Formula key</FieldLabel>
              <Input
                value={output.output_key}
                onChange={(e) => u("output_key", e.target.value.replace(/\W/g, "_"))}
                className="font-mono"
              />
            </div>
            <div>
              <FieldLabel>Decimal places</FieldLabel>
              <Input
                type="number"
                min="0"
                max="6"
                value={output.decimals}
                onChange={(e) => u("decimals", Math.max(0, Math.min(6, parseInt(e.target.value) || 0)))}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Description</FieldLabel>
              <Input value={output.description} onChange={(e) => u("description", e.target.value)} placeholder="Shown under the result" />
            </div>
          </div>
        </Advanced>
      </div>
    </div>
  )
}
