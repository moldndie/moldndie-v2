"use client"

import { useState } from "react"
import { Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Advanced, FieldLabel, Input, Problem, ReorderBtns, Select } from "./ui"
import { UnitsEditor } from "./UnitsEditor"
import type { DraftField } from "./builder-types"
import type { FieldType, UnitSystem } from "@/types/calculator"

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  number: "Number", text: "Text", select: "Dropdown", checkbox: "Checkbox", range: "Slider",
}

/**
 * One input. The visible surface is deliberately four controls — label, type,
 * unit, required. Everything else, including the formula key, lives behind
 * Advanced, because the key is derived and nobody should be typing one.
 */
export function FieldCard({ field, unitSystems, idx, total, problem, onUpdate, onRemove, onMove }: {
  field: DraftField
  unitSystems: UnitSystem[]
  idx: number
  total: number
  problem?: string
  onUpdate: <K extends keyof DraftField>(uid: string, key: K, val: DraftField[K]) => void
  onRemove: (uid: string) => void
  onMove: (idx: number, dir: 1 | -1) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const u = <K extends keyof DraftField>(k: K, v: DraftField[K]) => onUpdate(field._uid, k, v)
  const isNumeric = field.field_type === "number" || field.field_type === "range"

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-white", problem ? "border-red-300" : "border-zinc-200")}>
      <div className="flex items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
        <ReorderBtns idx={idx} total={total} onMove={(d) => onMove(idx, d)} />
        <button onClick={() => setExpanded((e) => !e)} className="flex-1 text-left">
          <span className="text-sm font-semibold text-zinc-900">
            {field.label || <em className="font-normal text-zinc-400">Untitled input</em>}
          </span>
          <span className="ml-2 text-xs text-zinc-400">{FIELD_TYPE_LABELS[field.field_type]}</span>
          {field.unit && <span className="ml-1 text-xs text-zinc-400">· {field.unit}</span>}
        </button>
        {expanded ? <ChevronUp className="size-4 text-zinc-300" /> : <ChevronDown className="size-4 text-zinc-300" />}
        <button onClick={() => onRemove(field._uid)} className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600">
          <Trash2 className="size-4" />
        </button>
      </div>

      {expanded && (
        <div className="space-y-4 p-4">
          {problem && <Problem>{problem}</Problem>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Label *</FieldLabel>
              <Input value={field.label} onChange={(e) => u("label", e.target.value)} placeholder="e.g. Wall Thickness" />
            </div>
            <div>
              <FieldLabel>Type</FieldLabel>
              <Select value={field.field_type} onChange={(e) => u("field_type", e.target.value as FieldType)}>
                <option value="number">Number</option>
                <option value="range">Slider</option>
                <option value="checkbox">Checkbox</option>
                <option value="text">Text</option>
                <option value="select">Dropdown</option>
              </Select>
            </div>
            <div>
              <FieldLabel hint="shown next to the label">Unit</FieldLabel>
              <Input value={field.unit} onChange={(e) => u("unit", e.target.value)} placeholder="mm, kg, MPa…" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={field.is_required} onChange={(e) => u("is_required", e.target.checked)} className="rounded" />
                <span className="text-sm text-zinc-700">Required</span>
              </label>
            </div>
          </div>

          <UnitsEditor systems={unitSystems} value={field.units} onChange={(v) => u("units", v)} />

          <Advanced>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel hint="the name your formulas use — changing it rewrites them">Formula key</FieldLabel>
                <Input
                  value={field.field_key}
                  onChange={(e) => u("field_key", e.target.value.replace(/\W/g, "_"))}
                  className="font-mono"
                />
              </div>
              <div>
                <FieldLabel>Placeholder</FieldLabel>
                <Input value={field.placeholder} onChange={(e) => u("placeholder", e.target.value)} placeholder="e.g. Enter thickness" />
              </div>
              <div>
                <FieldLabel>Help text</FieldLabel>
                <Input value={field.help_text} onChange={(e) => u("help_text", e.target.value)} placeholder="Short hint under the field" />
              </div>
              <div>
                <FieldLabel hint="groups inputs under a heading">Section</FieldLabel>
                <Input value={field.field_group} onChange={(e) => u("field_group", e.target.value)} placeholder="e.g. Part & Machine" />
              </div>
              <div>
                <FieldLabel>Default value</FieldLabel>
                <Input value={field.default_value} onChange={(e) => u("default_value", e.target.value)} placeholder="optional" />
              </div>
            </div>

            {isNumeric && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FieldLabel>Min</FieldLabel>
                  <Input type="number" value={field.min_value} onChange={(e) => u("min_value", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <FieldLabel>Max</FieldLabel>
                  <Input type="number" value={field.max_value} onChange={(e) => u("max_value", e.target.value)} placeholder="1000" />
                </div>
                <div>
                  <FieldLabel>Step</FieldLabel>
                  <Input type="number" value={field.step_value} onChange={(e) => u("step_value", e.target.value)} placeholder="0.01" />
                </div>
              </div>
            )}
          </Advanced>

          {field.field_type === "select" && (
            <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-800">
              This dropdown&rsquo;s choices come from a <strong>data table</strong>. Edit them in the
              Data tables section below.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
