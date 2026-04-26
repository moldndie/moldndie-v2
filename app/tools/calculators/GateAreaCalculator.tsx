"use client"

import { useState } from "react"
import { ResultCard } from "../_components/ResultCard"

const GATE_TYPES = [
  { label: "Edge / Side gate",       factor: 1.0 },
  { label: "Submarine / Tunnel gate", factor: 0.85 },
  { label: "Pin-point / Hot tip",    factor: 0.6  },
  { label: "Cashew / Banana gate",   factor: 0.8  },
  { label: "Fan gate",               factor: 1.2  },
]

const MATERIALS = [
  { label: "ABS",                 density: 1.05 },
  { label: "Polypropylene (PP)",  density: 0.91 },
  { label: "Polycarbonate (PC)",  density: 1.20 },
  { label: "Acetal / POM",       density: 1.41 },
  { label: "Nylon PA6",          density: 1.13 },
  { label: "HDPE",               density: 0.95 },
  { label: "Polystyrene (PS)",   density: 1.05 },
  { label: "PC + ABS",           density: 1.11 },
  { label: "TPE",                density: 0.95 },
  { label: "PMMA (Acrylic)",     density: 1.19 },
]

export function GateAreaCalculator() {
  const [weight, setWeight]     = useState("")
  const [fillTime, setFillTime] = useState("")
  const [matIdx, setMatIdx]     = useState(0)
  const [gateIdx, setGateIdx]   = useState(0)

  const w  = parseFloat(weight)   || 0
  const t  = parseFloat(fillTime) || 0
  const mat  = MATERIALS[matIdx]
  const gate = GATE_TYPES[gateIdx]

  // Gate area (mm²) = (part_weight_g / density_g/cc) / fill_time_s * 1000 (cc→mm³) / approx melt speed 150 mm/s
  // Simplified: Q = Volume/t, A = Q / v_melt, v_melt ≈ 50–200 mm/s; use 100 mm/s as default
  const MELT_SPEED_MM_S = 100
  const volumeCubicMm = w > 0 && mat.density > 0 ? (w / mat.density) * 1000 : 0
  const flowRateMm3s   = t > 0 ? volumeCubicMm / t : 0
  const baseArea       = flowRateMm3s > 0 ? flowRateMm3s / MELT_SPEED_MM_S : 0
  const gateArea       = baseArea * gate.factor

  // Min gate diameter for circular gate (for reference)
  const diameter = gateArea > 0 ? 2 * Math.sqrt(gateArea / Math.PI) : 0

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
              <option key={i} value={i}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Gate type</label>
          <select
            value={gateIdx}
            onChange={(e) => setGateIdx(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
          >
            {GATE_TYPES.map((g, i) => (
              <option key={i} value={i}>{g.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Part weight (g)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 25"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Target fill time (s)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={fillTime}
            onChange={(e) => setFillTime(e.target.value)}
            placeholder="e.g. 1.5"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>
      </div>

      {gateArea > 0 ? (
        <div className="space-y-3">
          <ResultCard
            label="Minimum gate area"
            value={`${gateArea.toFixed(2)} mm²`}
            note={`Assuming melt front speed ≈ ${MELT_SPEED_MM_S} mm/s with ${gate.label} factor.`}
          />
          <ResultCard
            label="Equivalent circular diameter"
            value={`∅ ${diameter.toFixed(2)} mm`}
            note="Reference only. Verify with mold flow analysis."
          />
        </div>
      ) : (
        <p className="text-sm text-zinc-400">Enter part weight and fill time to see results.</p>
      )}
    </div>
  )
}
