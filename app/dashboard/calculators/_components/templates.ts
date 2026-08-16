// Ready-made calculators. Picking one is the fastest way to a correct tool, so
// the gallery is the first thing a new calculator shows.

import type { DraftField, DraftOutput } from "./builder-types"

export const TEMPLATES: Record<string, {
  title: string
  description: string
  fields: Partial<DraftField>[]
  outputs: Partial<DraftOutput>[]
}> = {
  circle_area: {
    title: "Area of Circle",
    description: "Calculate the area of a circle given its radius.",
    fields: [{ label: "Radius", field_key: "radius", field_type: "number", unit: "cm", is_required: true }],
    outputs: [{ label: "Area", output_key: "area", formula: "pi * radius * radius", unit: "cm²", decimals: 2 }],
  },
  rectangle_area: {
    title: "Rectangle Area",
    description: "Calculate the area of a rectangle.",
    fields: [
      { label: "Length", field_key: "length", field_type: "number", unit: "cm", is_required: true },
      { label: "Width", field_key: "width", field_type: "number", unit: "cm", is_required: true },
    ],
    outputs: [{ label: "Area", output_key: "area", formula: "length * width", unit: "cm²", decimals: 2 }],
  },
  cylinder_volume: {
    title: "Cylinder Volume",
    description: "Calculate the volume of a cylinder.",
    fields: [
      { label: "Radius", field_key: "radius", field_type: "number", unit: "cm", is_required: true },
      { label: "Height", field_key: "height", field_type: "number", unit: "cm", is_required: true },
    ],
    outputs: [{ label: "Volume", output_key: "volume", formula: "pi * radius * radius * height", unit: "cm³", decimals: 2 }],
  },
  percentage_increase: {
    title: "Percentage Increase",
    description: "Calculate the percentage increase between two values.",
    fields: [
      { label: "Original Value", field_key: "original", field_type: "number", is_required: true },
      { label: "New Value", field_key: "new_value", field_type: "number", is_required: true },
    ],
    outputs: [{ label: "Increase", output_key: "increase", formula: "((new_value - original) / original) * 100", unit: "%", decimals: 2 }],
  },
  clamp_force: {
    title: "Clamp Force Calculator",
    description: "Estimate required clamping force for injection molding.",
    fields: [
      { label: "Projected Area", field_key: "projected_area", field_type: "number", unit: "cm²", is_required: true, default_value: "120", placeholder: "e.g. 120" },
      { label: "Cavity Pressure", field_key: "pressure", field_type: "number", unit: "MPa", is_required: true, default_value: "350", placeholder: "e.g. 350" },
    ],
    outputs: [{ label: "Clamp Force", output_key: "clamp_force", formula: "(projected_area * pressure) / 1000", unit: "kN", decimals: 1 }],
  },
  shrinkage: {
    title: "Shrinkage Calculator",
    description: "Calculate mold shrinkage rate from mold and part dimensions.",
    fields: [
      { label: "Mold Dimension", field_key: "mold_dim", field_type: "number", unit: "mm", is_required: true, default_value: "100" },
      { label: "Part Dimension", field_key: "part_dim", field_type: "number", unit: "mm", is_required: true, default_value: "99.5" },
    ],
    outputs: [{ label: "Shrinkage Rate", output_key: "shrinkage_rate", formula: "((mold_dim - part_dim) / mold_dim) * 100", unit: "%", decimals: 3 }],
  },
  cycle_time: {
    title: "Injection Molding Cycle Time",
    description: "Estimate total injection molding cycle time — mold open/close, injection, holding and cooling — from part geometry and the selected material's thermal properties.",
    fields: [
      {
        label: "Material", field_key: "material", field_type: "select", field_group: "Material Selection",
        is_required: true, default_value: "abs", help_text: "Auto-fills thermal diffusivity, melt/mold temperature and heat-deflection temperature.",
        options_text: JSON.stringify([
          { label: "ABS",    value: "abs",    values: { alpha: 0.080, melt_temp: 220,   mold_temp: 45,   hdt: 85 } },
          { label: "HIPS",   value: "hips",   values: { alpha: 0.080, melt_temp: 220,   mold_temp: 45,   hdt: 85 } },
          { label: "PS",     value: "ps",     values: { alpha: 0.080, melt_temp: 220,   mold_temp: 55,   hdt: 85 } },
          { label: "PP",     value: "pp",     values: { alpha: 0.065, melt_temp: 230,   mold_temp: 37.5, hdt: 85 } },
          { label: "HDPE",   value: "hdpe",   values: { alpha: 0.090, melt_temp: 225,   mold_temp: 32.5, hdt: 50 } },
          { label: "LDPE",   value: "ldpe",   values: { alpha: 0.090, melt_temp: 225,   mold_temp: 32.5, hdt: 50 } },
          { label: "PMMA",   value: "pmma",   values: { alpha: 0.075, melt_temp: 220,   mold_temp: 55,   hdt: 90 } },
          { label: "POM",    value: "pom",    values: { alpha: 0.060, melt_temp: 220,   mold_temp: 57.5, hdt: 115 } },
          { label: "PA6",    value: "pa6",    values: { alpha: 0.070, melt_temp: 237.5, mold_temp: 90,   hdt: 130 } },
          { label: "PA66",   value: "pa66",   values: { alpha: 0.085, melt_temp: 282.5, mold_temp: 90,   hdt: 150 } },
          { label: "PBT",    value: "pbt",    values: { alpha: 0.090, melt_temp: 245,   mold_temp: 100,  hdt: 150 } },
          { label: "PET",    value: "pet",    values: { alpha: 0.090, melt_temp: 275,   mold_temp: 100,  hdt: 150 } },
          { label: "PC",     value: "pc",     values: { alpha: 0.105, melt_temp: 290,   mold_temp: 85,   hdt: 130 } },
          { label: "PC-ABS", value: "pc_abs", values: { alpha: 0.095, melt_temp: 250,   mold_temp: 65,   hdt: 110 } },
        ]),
      },
      { label: "Clamping Force", field_key: "clamp_force", field_type: "number", unit: "tons", is_required: true, default_value: "100", field_group: "Part & Machine", placeholder: "e.g. 100" },
      { label: "Product Weight", field_key: "weight", field_type: "number", unit: "g", is_required: true, default_value: "50", field_group: "Part & Machine", placeholder: "e.g. 50" },
      { label: "Max Wall Thickness", field_key: "wall", field_type: "number", unit: "mm", is_required: true, default_value: "2", field_group: "Part & Machine", placeholder: "e.g. 2", help_text: "Thickest wall section of the part." },
    ],
    outputs: [
      { label: "Mold Open/Close Time (T₀)", output_key: "t0", formula: "0.013 * clamp_force + 3.6", unit: "s", decimals: 2, description: "Machine dry-cycle time, scaled by clamping force." },
      { label: "Injection Time (Tᵢ)",       output_key: "ti", formula: "0.0085 * weight + 0.5",     unit: "s", decimals: 2, description: "Fill time, scaled by shot weight." },
      { label: "Holding Time (Tₕ)",         output_key: "th", formula: "0.6 * wall^2 + 0.3 * wall",  unit: "s", decimals: 2, description: "Pack/hold time, scaled by wall thickness." },
      { label: "Cooling Time (Tᶜ)",         output_key: "tc", formula: "wall^2 / (alpha * pi^2) * log(8 / pi^2 * (melt_temp - mold_temp) / (hdt - mold_temp))", unit: "s", decimals: 2, description: "Heat-diffusion cooling time from material properties." },
      { label: "Total Cycle Time",          output_key: "total", formula: "t0 + ti + th + tc",       unit: "s", decimals: 2, description: "Sum of all four phases." },
    ],
  },
}
