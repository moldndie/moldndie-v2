"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Input, Select } from "./ui"
import { UNIT_GROUPS, groupOf } from "./unit-presets"
import type { DraftUnits } from "./builder-types"
import type { UnitSystem } from "@/types/calculator"

/**
 * Pick a unit per system instead of typing a conversion factor.
 *
 * Typing factors is where the mistakes were: an inverted factor (25.4 instead of
 * 1/25.4) looks perfectly plausible in a text box and is wrong by a factor of
 * 645. Picking "Inch (in)" cannot be inverted, and it carries the offset that
 * makes °C ↔ °F work.
 */
export function UnitsEditor({ systems, value, onChange }: {
  systems: UnitSystem[]
  value: DraftUnits
  onChange: (v: DraftUnits) => void
}) {
  // Which quantity this field measures — drives the unit list for every system.
  const initial = groupOf(Object.values(value)[0]?.unit ?? "")?.name ?? ""
  const [groupName, setGroupName] = useState(initial)
  const [manual, setManual] = useState(!!Object.values(value).length && !initial)

  if (systems.length === 0) return null

  const group = UNIT_GROUPS.find((g) => g.name === groupName)

  function pick(systemKey: string, unit: string) {
    const preset = group?.units.find((u) => u.unit === unit)
    if (!preset) {
      const next = { ...value }
      delete next[systemKey]
      onChange(next)
      return
    }
    onChange({
      ...value,
      [systemKey]: { unit: preset.unit, factor: String(preset.factor), offset: String(preset.offset ?? 0) },
    })
  }

  function setManualField(systemKey: string, patch: Partial<{ unit: string; factor: string; offset: string }>) {
    onChange({
      ...value,
      [systemKey]: {
        unit: value[systemKey]?.unit ?? "",
        factor: value[systemKey]?.factor ?? "1",
        offset: value[systemKey]?.offset ?? "0",
        ...patch,
      },
    })
  }

  return (
    <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3 sm:col-span-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-zinc-500">This measures</span>
        <select
          value={manual ? "__manual__" : groupName}
          onChange={(e) => {
            const v = e.target.value
            setManual(v === "__manual__")
            setGroupName(v === "__manual__" ? "" : v)
            if (v !== "__manual__") onChange({})
          }}
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">— pick a quantity —</option>
          {UNIT_GROUPS.map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
          <option value="__manual__">Something else (enter manually)</option>
        </select>
      </div>

      {group && (
        <>
          {systems.map((sys) => (
            <div key={sys.key} className="flex items-center gap-2">
              <span className="w-32 shrink-0 truncate text-xs text-zinc-500" title={sys.label}>{sys.label}</span>
              <Select
                className="py-1.5 text-xs"
                value={value[sys.key]?.unit ?? ""}
                onChange={(e) => pick(sys.key, e.target.value)}
              >
                <option value="">— none —</option>
                {group.units.map((u) => <option key={u.unit} value={u.unit}>{u.label}</option>)}
              </Select>
            </div>
          ))}
          <p className="text-[11px] leading-relaxed text-zinc-400">
            Write your formula in <strong>{group.base}</strong> — whichever system the visitor
            picks is converted for you, both on the way in and on the way out.
          </p>
        </>
      )}

      {manual && (
        <>
          {systems.map((sys) => (
            <div key={sys.key} className="flex items-center gap-2">
              <span className="w-32 shrink-0 truncate text-xs text-zinc-500" title={sys.label}>{sys.label}</span>
              <Input
                className={cn("py-1.5 text-xs")}
                value={value[sys.key]?.unit ?? ""}
                onChange={(e) => setManualField(sys.key, { unit: e.target.value })}
                placeholder="unit"
              />
              <Input
                className="py-1.5 font-mono text-xs"
                value={value[sys.key]?.factor ?? ""}
                onChange={(e) => setManualField(sys.key, { factor: e.target.value })}
                placeholder="× factor"
              />
              <Input
                className="py-1.5 font-mono text-xs"
                value={value[sys.key]?.offset ?? ""}
                onChange={(e) => setManualField(sys.key, { offset: e.target.value })}
                placeholder="+ offset"
              />
            </div>
          ))}
          <p className="text-[11px] leading-relaxed text-zinc-400">
            Shown value = base value × factor + offset. Leave the system you write your
            formula in at factor <code>1</code>, offset <code>0</code>.
          </p>
        </>
      )}
    </div>
  )
}
