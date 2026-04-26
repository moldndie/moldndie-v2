"use client"

import { useState } from "react"
import { ResultCard } from "../_components/ResultCard"

const MATERIALS = [
  { label: "ABS",                      min: 1.2, max: 3.5 },
  { label: "Polypropylene (PP)",        min: 0.8, max: 3.8 },
  { label: "Polycarbonate (PC)",        min: 1.0, max: 4.0 },
  { label: "Acetal / POM",             min: 0.8, max: 3.0 },
  { label: "Nylon PA6",                min: 0.8, max: 3.0 },
  { label: "HDPE",                     min: 0.8, max: 3.0 },
  { label: "LDPE",                     min: 0.8, max: 3.0 },
  { label: "Polystyrene (PS)",         min: 1.0, max: 4.0 },
  { label: "TPE / TPU",               min: 1.5, max: 5.0 },
  { label: "PC + ABS Blend",           min: 1.2, max: 3.5 },
  { label: "PMMA (Acrylic)",           min: 1.5, max: 5.0 },
  { label: "PBT",                      min: 0.8, max: 3.0 },
  { label: "PET",                      min: 0.8, max: 3.0 },
  { label: "Polysulfone (PSU)",        min: 1.5, max: 4.5 },
  { label: "Aluminum (die cast)",      min: 1.0, max: 4.0 },
  { label: "Zinc (die cast)",          min: 0.5, max: 3.0 },
]

const APPLICATIONS = [
  { label: "Structural / Load-bearing",  factor: 1.3 },
  { label: "General / Housings",         factor: 1.0 },
  { label: "Thin-wall packaging",        factor: 0.5 },
  { label: "Living hinges (PP/PE only)", factor: 0.2 },
]

export function WallThicknessAdvisor() {
  const [matIdx, setMatIdx]   = useState(0)
  const [appIdx, setAppIdx]   = useState(1)

  const mat = MATERIALS[matIdx]
  const app = APPLICATIONS[appIdx]

  const adjusted_min = Math.max(0.4, mat.min * (app.factor < 1 ? app.factor : 1))
  const adjusted_max = Math.max(adjusted_min + 0.5, mat.max * (app.factor > 1 ? app.factor : 1))

  const isLivingHinge = app.label.includes("Living hinge")

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
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Application</label>
          <select
            value={appIdx}
            onChange={(e) => setAppIdx(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
          >
            {APPLICATIONS.map((a, i) => (
              <option key={i} value={i}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      <ResultCard
        label="Recommended Wall Thickness"
        value={isLivingHinge
          ? "0.25 – 0.40 mm (PP/PE only)"
          : `${adjusted_min.toFixed(1)} – ${adjusted_max.toFixed(1)} mm`}
        note={isLivingHinge
          ? "Living hinges require extremely thin sections. Only PP and HDPE/LDPE are suitable."
          : "Keep all walls within ±25 % of each other to minimize sink and warpage."}
      />
    </div>
  )
}
