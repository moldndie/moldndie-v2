"use client"

import { useState } from "react"
import { ResultCard } from "../_components/ResultCard"

const MATERIALS = [
  { label: "ABS",                  shrinkMin: 0.4, shrinkMax: 0.9 },
  { label: "Polypropylene (PP)",   shrinkMin: 1.0, shrinkMax: 2.5 },
  { label: "Polycarbonate (PC)",   shrinkMin: 0.5, shrinkMax: 0.7 },
  { label: "Acetal / POM",        shrinkMin: 1.8, shrinkMax: 2.5 },
  { label: "Nylon PA6",           shrinkMin: 0.6, shrinkMax: 1.4 },
  { label: "Nylon PA66",          shrinkMin: 1.0, shrinkMax: 2.2 },
  { label: "HDPE",                shrinkMin: 1.5, shrinkMax: 4.0 },
  { label: "LDPE",                shrinkMin: 1.5, shrinkMax: 5.0 },
  { label: "Polystyrene (PS)",    shrinkMin: 0.3, shrinkMax: 0.6 },
  { label: "PC + ABS Blend",      shrinkMin: 0.4, shrinkMax: 0.7 },
  { label: "TPE / TPU",          shrinkMin: 1.0, shrinkMax: 2.0 },
  { label: "PMMA (Acrylic)",      shrinkMin: 0.2, shrinkMax: 0.8 },
]

export function ShrinkageCalculator() {
  const [matIdx, setMatIdx]       = useState(0)
  const [partDim, setPartDim]     = useState("")
  const [customShrink, setCustom] = useState("")
  const [useCustom, setUseCustom] = useState(false)

  const mat = MATERIALS[matIdx]
  const dim = parseFloat(partDim) || 0
  const shrink = parseFloat(customShrink) || 0

  // Cavity = part_size / (1 - shrinkage/100)
  const cavMin = dim > 0 ? dim / (1 - mat.shrinkMin / 100) : null
  const cavMax = dim > 0 ? dim / (1 - mat.shrinkMax / 100) : null
  const cavCustom = dim > 0 && shrink > 0 ? dim / (1 - shrink / 100) : null

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Material</label>
          <select
            value={matIdx}
            onChange={(e) => setMatIdx(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
          >
            {MATERIALS.map((m, i) => (
              <option key={i} value={i}>{m.label} ({m.shrinkMin}–{m.shrinkMax}%)</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Part dimension (mm)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={partDim}
            onChange={(e) => setPartDim(e.target.value)}
            placeholder="e.g. 50.00"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>

        <div className="sm:col-span-2 flex items-center gap-2">
          <input
            id="useCustom"
            type="checkbox"
            checked={useCustom}
            onChange={(e) => setUseCustom(e.target.checked)}
            className="rounded border-zinc-300 text-primary focus:ring-primary/30"
          />
          <label htmlFor="useCustom" className="text-sm text-zinc-600 cursor-pointer">
            Use custom shrinkage from datasheet (%)
          </label>
        </div>

        {useCustom && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Custom shrinkage (%)</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.01"
              value={customShrink}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="e.g. 1.80"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
        )}
      </div>

      {dim > 0 ? (
        <div className="space-y-3">
          {!useCustom && cavMin !== null && cavMax !== null && (
            <ResultCard
              label="Cavity dimension range (mm)"
              value={`${cavMin.toFixed(3)} – ${cavMax.toFixed(3)}`}
              note={`Shrinkage range: ${mat.shrinkMin}–${mat.shrinkMax}% for ${MATERIALS[matIdx].label}`}
            />
          )}
          {useCustom && cavCustom !== null && (
            <ResultCard
              label="Cavity dimension (mm)"
              value={cavCustom.toFixed(3)}
              note={`Custom shrinkage: ${shrink}%`}
            />
          )}
          {useCustom && !cavCustom && (
            <p className="text-sm text-zinc-400">Enter a custom shrinkage value above.</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-zinc-400">Enter a part dimension to see results.</p>
      )}
    </div>
  )
}
