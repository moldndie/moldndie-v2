"use client"

import { useMemo, useState } from "react"
import { Plus, RotateCcw, Delete } from "lucide-react"
import { cn } from "@/lib/utils"
import { evaluateFormula, FUNCTION_NAMES, CONSTANT_NAMES, FUNCTION_ARITY } from "@/lib/formula-engine"
import { hydrate, serialize, type FormulaToken } from "@/lib/formula-tokens"

/**
 * Formulas are built by clicking, not typing.
 *
 * The stored value is still the same plain expression string — this only changes
 * how it is authored. Variables are shown by their human label and can only be
 * inserted from a menu, so "Unknown variable 'clamp_force'" (which is live on the
 * seeded calculator right now) stops being possible to create.
 */

/** Operators read better as maths symbols than as the ASCII we store. */
const OP_LABEL: Record<string, string> = { "+": "+", "-": "−", "*": "×", "/": "÷", "^": "^" }

export interface VarOption {
  key: string
  label: string
  /** Menu heading — "Inputs", "Table values", "Earlier results". */
  group: string
}

// ── component ────────────────────────────────────────────────────────────────

interface Props {
  value: string
  onChange: (expr: string) => void
  vars: VarOption[]
  /** Sample numbers for the live result. */
  sampleVars: Record<string, number>
  /** Unit shown next to the live result. */
  unit?: string
  /** Create a missing input on the spot; returns its key. */
  onCreateInput?: (label: string) => string
}

export default function FormulaEditor({ value, onChange, vars, sampleVars, unit, onCreateInput }: Props) {
  const tokens = useMemo(() => hydrate(value), [value])
  // Caret sits *between* pills; inserts land here, backspace eats what's before it.
  const [caret, setCaret] = useState<number | null>(null)
  const [editingNum, setEditingNum] = useState<number | null>(null)

  const varLabel = useMemo(() => {
    const m = new Map(vars.map((v) => [v.key, v.label]))
    return (key: string) => m.get(key) ?? key
  }, [vars])

  const grouped = useMemo(() => {
    const m = new Map<string, VarOption[]>()
    for (const v of vars) {
      if (!m.has(v.group)) m.set(v.group, [])
      m.get(v.group)!.push(v)
    }
    return [...m.entries()]
  }, [vars])

  // A formula the pill model can't express — let them edit the text directly
  // rather than silently mangling it.
  if (tokens === null) {
    return (
      <div className="space-y-1.5">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-xs text-amber-700">
          Advanced formula — edited as text. Clear it to go back to the visual builder.
        </p>
        <LiveResult formula={value} sampleVars={sampleVars} unit={unit} />
      </div>
    )
  }

  const pos = caret ?? tokens.length

  function commit(next: FormulaToken[], nextCaret: number) {
    onChange(serialize(next))
    setCaret(nextCaret)
  }

  function insert(...toks: FormulaToken[]) {
    const next = [...tokens!.slice(0, pos), ...toks, ...tokens!.slice(pos)]
    commit(next, pos + toks.length)
  }

  function backspace() {
    if (pos === 0) return
    const next = [...tokens!]
    next.splice(pos - 1, 1)
    commit(next, pos - 1)
  }

  function removeAt(i: number) {
    const next = [...tokens!]
    next.splice(i, 1)
    commit(next, Math.min(i, next.length))
  }

  function handleVarPick(raw: string) {
    if (!raw) return
    if (raw === "__new__") {
      const label = window.prompt("Name the new input, e.g. Wall Thickness")?.trim()
      if (!label || !onCreateInput) return
      insert({ kind: "var", key: onCreateInput(label) })
      return
    }
    insert({ kind: "var", key: raw })
  }

  function handleFnPick(name: string) {
    if (!name) return
    if (CONSTANT_NAMES.includes(name)) { insert({ kind: "const", name }); return }
    // Insert the closing paren too, and drop the caret inside the call.
    const args = FUNCTION_ARITY[name] ?? 1
    const inner: FormulaToken[] = args > 1 ? [{ kind: "comma" }] : []
    const next = [
      ...tokens!.slice(0, pos),
      { kind: "fn", name } as FormulaToken,
      ...inner,
      { kind: "paren", p: ")" } as FormulaToken,
      ...tokens!.slice(pos),
    ]
    commit(next, pos + 1)
  }

  const selectCls =
    "rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
  const btnCls =
    "rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-primary hover:text-primary"

  return (
    <div className="space-y-2">
      {/* Canvas */}
      <div
        role="group"
        aria-label="Formula"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Backspace") { e.preventDefault(); backspace() }
          if (e.key === "ArrowLeft") setCaret(Math.max(0, pos - 1))
          if (e.key === "ArrowRight") setCaret(Math.min(tokens.length, pos + 1))
        }}
        onClick={() => setCaret(null)}
        className="flex min-h-14 flex-wrap items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50/60 p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {tokens.length === 0 && (
          <span className="px-1 text-xs text-zinc-400">
            Build the formula with the buttons below — pick an input, an operator, a number.
          </span>
        )}

        {tokens.map((t, i) => (
          <span key={i} className="flex items-center">
            <Caret active={pos === i} />
            {t.kind === "num" && editingNum === i ? (
              <input
                autoFocus
                value={t.text}
                onChange={(e) => {
                  const next = [...tokens]
                  next[i] = { kind: "num", text: e.target.value.replace(/[^0-9.\-]/g, "") }
                  onChange(serialize(next))
                }}
                onBlur={() => setEditingNum(null)}
                onKeyDown={(e) => { if (e.key === "Enter") setEditingNum(null) }}
                onClick={(e) => e.stopPropagation()}
                className="w-20 rounded-md border border-primary px-2 py-1 text-sm tabular-nums focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setCaret(i + 1)
                  if (t.kind === "num") setEditingNum(i)
                }}
                onDoubleClick={(e) => { e.stopPropagation(); removeAt(i) }}
                title="Click to place the cursor · double-click to delete"
                className={cn(
                  "rounded-md px-2 py-1 text-sm font-medium transition-colors",
                  t.kind === "var" && "bg-primary/10 text-primary hover:bg-primary/20",
                  t.kind === "num" && "bg-white border border-zinc-200 text-zinc-800 tabular-nums hover:border-zinc-300",
                  t.kind === "op" && "font-bold text-zinc-500 hover:text-zinc-900",
                  t.kind === "paren" && "text-zinc-400 hover:text-zinc-700",
                  t.kind === "fn" && "bg-violet-100 text-violet-700 hover:bg-violet-200",
                  t.kind === "const" && "bg-zinc-200 text-zinc-700",
                  t.kind === "comma" && "text-zinc-400",
                )}
              >
                {t.kind === "var" ? varLabel(t.key)
                  : t.kind === "num" ? (t.text || "0")
                  : t.kind === "op" ? OP_LABEL[t.op]
                  : t.kind === "paren" ? t.p
                  : t.kind === "fn" ? `${t.name}(`
                  : t.kind === "const" ? t.name
                  : ","}
              </button>
            )}
          </span>
        ))}
        <Caret active={pos === tokens.length} />
      </div>

      {/* Palette */}
      <div className="flex flex-wrap items-center gap-1.5">
        <select className={selectCls} value="" onChange={(e) => handleVarPick(e.target.value)}>
          <option value="">+ Input ▾</option>
          {grouped.map(([group, items]) => (
            <optgroup key={group} label={group}>
              {items.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
            </optgroup>
          ))}
          {onCreateInput && <option value="__new__">＋ New input…</option>}
        </select>

        <button type="button" className={btnCls} onClick={() => insert({ kind: "num", text: "0" })}>
          <Plus className="mr-0.5 inline size-3" /> Number
        </button>

        <span className="flex items-center gap-1">
          {(["+", "-", "*", "/", "^"] as const).map((op) => (
            <button key={op} type="button" className={cn(btnCls, "w-8 px-0 text-center")} onClick={() => insert({ kind: "op", op })}>
              {OP_LABEL[op]}
            </button>
          ))}
          <button type="button" className={cn(btnCls, "w-8 px-0 text-center")} onClick={() => insert({ kind: "paren", p: "(" })}>(</button>
          <button type="button" className={cn(btnCls, "w-8 px-0 text-center")} onClick={() => insert({ kind: "paren", p: ")" })}>)</button>
        </span>

        <select className={selectCls} value="" onChange={(e) => handleFnPick(e.target.value)}>
          <option value="">+ Function ▾</option>
          <optgroup label="Functions">
            {FUNCTION_NAMES.map((f) => <option key={f} value={f}>{f}()</option>)}
          </optgroup>
          <optgroup label="Constants">
            {CONSTANT_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
          </optgroup>
        </select>

        <span className="flex-1" />

        <button
          type="button"
          onClick={backspace}
          disabled={pos === 0}
          className={cn(btnCls, "disabled:opacity-30")}
          title="Delete the item before the cursor"
        >
          <Delete className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => commit([], 0)}
          disabled={tokens.length === 0}
          className={cn(btnCls, "disabled:opacity-30")}
          title="Clear the formula"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      <LiveResult formula={value} sampleVars={sampleVars} unit={unit} />
    </div>
  )
}

function Caret({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("mx-px h-6 w-0.5 rounded-full transition-colors", active ? "bg-primary" : "bg-transparent")}
    />
  )
}

/**
 * The old badge tested every variable as 1, so a formula could read "valid" and
 * still be nonsense. This runs the real sample values and shows the number.
 */
function LiveResult({ formula, sampleVars, unit }: { formula: string; sampleVars: Record<string, number>; unit?: string }) {
  if (!formula.trim()) return null
  const r = evaluateFormula(formula, sampleVars)
  return "error" in r ? (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{r.error}</p>
  ) : (
    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
      With your sample values →{" "}
      <strong className="tabular-nums">
        {Number.isInteger(r.value) ? r.value : r.value.toFixed(3)}
      </strong>
      {unit ? ` ${unit}` : ""}
    </p>
  )
}
