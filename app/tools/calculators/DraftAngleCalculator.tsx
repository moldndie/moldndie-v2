"use client"

import { useState } from "react"
import { ResultCard } from "../_components/ResultCard"

const SURFACE_TYPES = [
  { label: "Smooth / Polished (A1–A3)", min: 0.5, max: 1, note: "Minimum draft for highly polished surfaces." },
  { label: "Semi-gloss / Textured (B1–B3)", min: 1, max: 2, note: "Standard commercial finish." },
  { label: "Matte / Light Texture (C1–C2)", min: 2, max: 3, note: "Add 1° per 0.025 mm texture depth." },
  { label: "Heavy Texture / Leather (D1–D3)", min: 3, max: 5, note: "Deep EDM textures require generous draft." },
]

const MATERIALS = [
  { label: "ABS", modifier: 0 },
  { label: "Polypropylene (PP)", modifier: 0 },
  { label: "Polycarbonate (PC)", modifier: 0.5 },
  { label: "Acetal / POM", modifier: 0.5 },
  { label: "Nylon (PA6/PA66)", modifier: 0.5 },
  { label: "HDPE / LDPE", modifier: -0.5 },
  { label: "TPE / TPU (flexible)", modifier: -0.5 },
  { label: "PC+ABS Blend", modifier: 0.25 },
]

export function DraftAngleCalculator() {
  const [surface, setSurface] = useState(0)
  const [material, setMaterial] = useState(0)
  const [depth, setDepth] = useState("")

  const surf = SURFACE_TYPES[surface]
  const mat  = MATERIALS[material]

  const depthVal = parseFloat(depth) || 0
  const textureBonus = depthVal > 0 ? (depthVal / 0.025) * 1 : 0

  const minDraft = Math.max(0.1, surf.min + mat.modifier + textureBonus)
  const maxDraft = Math.max(minDraft + 0.5, surf.max + mat.modifier + textureBonus)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Surface Finish</label>
          <select
            value={surface}
            onChange={(e) => setSurface(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
          >
            {SURFACE_TYPES.map((s, i) => (
              <option key={i} value={i}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Material</label>
          <select
            value={material}
            onChange={(e) => setMaterial(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
          >
            {MATERIALS.map((m, i) => (
              <option key={i} value={i}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Texture depth <span className="font-normal text-zinc-400">(mm, optional)</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.025"
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            placeholder="e.g. 0.075"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>
      </div>

      <ResultCard
        label="Recommended Draft Angle"
        value={`${minDraft.toFixed(1)}° – ${maxDraft.toFixed(1)}°`}
        note={surf.note}
      />
    </div>
  )
}
