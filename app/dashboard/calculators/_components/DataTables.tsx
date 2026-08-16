"use client"

import { Plus, Trash2, Table2, MousePointerClick } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "./ui"
import { uid, slugKey, type DraftTable } from "./builder-types"

/**
 * One place for tables, whether or not visitors pick from them.
 *
 * There used to be two: a dropdown's hidden "property values" grid, and a
 * separate reference table. Same spreadsheet, two editors, two mental models.
 * Here a table is a table, and a checkbox decides whether it also becomes an
 * input the visitor chooses a row from.
 *
 * Columns carry a real label, so the published table says "Melt Temperature"
 * instead of `melt_temp`.
 */
export function DataTables({ tables, onChange }: { tables: DraftTable[]; onChange: (v: DraftTable[]) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Data tables</p>
          <p className="text-xs text-zinc-500">
            Material properties, standard sizes, lookup values. Visitors can search them on the
            published page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...tables, newTable()])}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-4" /> Add table
        </button>
      </div>

      {tables.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-zinc-200 py-8 text-center">
          <Table2 className="mx-auto mb-2 size-7 text-zinc-200" />
          <p className="text-sm text-zinc-400">No data tables. Most calculators don&rsquo;t need one.</p>
        </div>
      )}

      {tables.map((t, i) => (
        <TableCard
          key={t._uid}
          table={t}
          onChange={(patch) => onChange(tables.map((x, j) => (j === i ? { ...x, ...patch } : x)))}
          onRemove={() => onChange(tables.filter((_, j) => j !== i))}
        />
      ))}
    </div>
  )
}

function newTable(): DraftTable {
  const first = { id: uid(), key: "name", label: "Name", unit: "" }
  return {
    _uid: uid(), title: "", category: "", columns: [first],
    rows: [{ id: uid(), cells: {} }, { id: uid(), cells: {} }],
  }
}

function TableCard({ table, onChange, onRemove }: {
  table: DraftTable
  onChange: (patch: Partial<DraftTable>) => void
  onRemove: () => void
}) {
  const cellCls =
    "w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"

  const isPicker = table.pickerFieldUid !== undefined

  function setColumn(id: string, patch: Partial<DraftTable["columns"][number]>) {
    onChange({
      columns: table.columns.map((c) => {
        if (c.id !== id) return c
        const next = { ...c, ...patch }
        // Key follows the label until the column has cells relying on it.
        if (patch.label !== undefined) next.key = slugKey(patch.label) || c.key
        return next
      }),
    })
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <Input value={table.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Table name, e.g. Material Properties" />
        <Input value={table.category} onChange={(e) => onChange({ category: e.target.value })} placeholder="Category (optional)" className="max-w-48" />
        <button type="button" onClick={onRemove} className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600">
          <Trash2 className="size-4" />
        </button>
      </div>

      <label className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors",
        isPicker ? "border-primary/40 bg-primary/5" : "border-zinc-200",
      )}>
        <input
          type="checkbox"
          checked={isPicker}
          onChange={(e) => onChange({ pickerFieldUid: e.target.checked ? uid() : undefined })}
          className="mt-0.5 rounded"
        />
        <span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-800">
            <MousePointerClick className="size-3.5" /> Visitors pick a row from this table
          </span>
          <span className="mt-0.5 block text-xs text-zinc-500">
            Adds a dropdown input. Choosing a row loads its numbers into your formulas — the
            first column is the choice name, every other column becomes a value you can use.
          </span>
        </span>
      </label>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1">
          <thead>
            <tr>
              {table.columns.map((c, ci) => (
                <th key={c.id} className="text-left">
                  <div className="flex items-center gap-0.5">
                    <input
                      value={c.label}
                      onChange={(e) => setColumn(c.id, { label: e.target.value })}
                      placeholder={ci === 0 ? "Name" : "Column"}
                      className={cn(cellCls, "min-w-28 font-medium")}
                    />
                    <input
                      value={c.unit}
                      onChange={(e) => setColumn(c.id, { unit: e.target.value })}
                      placeholder="unit"
                      className={cn(cellCls, "w-16")}
                    />
                    {table.columns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onChange({ columns: table.columns.filter((x) => x.id !== c.id) })}
                        className="rounded p-1 text-zinc-300 hover:text-red-600"
                        title="Remove column"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
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
                      className={cn(cellCls, "min-w-28")}
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
          onClick={() => onChange({ rows: [...table.rows, { id: uid(), cells: {} }] })}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-3.5" /> Add row
        </button>
        {isPicker && (
          <span className="text-[11px] text-zinc-400">
            Numeric columns become formula values; text cells still show in the published table.
          </span>
        )}
      </div>
    </div>
  )
}
