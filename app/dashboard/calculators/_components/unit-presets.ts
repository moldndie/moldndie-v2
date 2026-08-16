/**
 * Conversion catalogue for the builder's unit picker.
 *
 * Every entry converts FROM the group's base unit TO itself:
 *   display = base × factor + offset
 * so the base unit of each group is `{ factor: 1, offset: 0 }`. The author picks
 * a unit per system instead of typing a factor, which is where the mistakes
 * were — an inverted factor looks perfectly plausible in a text box.
 *
 * `offset` exists for temperature and nothing else, but it costs one number and
 * a °C↔°F field is silently wrong without it.
 */

export interface UnitPreset {
  /** What the visitor sees, e.g. "mm". */
  unit: string
  label: string
  factor: number
  offset?: number
}

export interface UnitGroup {
  name: string
  /** Unit the factors are relative to — the natural one to write formulas in. */
  base: string
  units: UnitPreset[]
}

export const UNIT_GROUPS: UnitGroup[] = [
  {
    name: "Length",
    base: "mm",
    units: [
      { unit: "mm", label: "Millimetre (mm)", factor: 1 },
      { unit: "cm", label: "Centimetre (cm)", factor: 0.1 },
      { unit: "m", label: "Metre (m)", factor: 0.001 },
      { unit: "in", label: "Inch (in)", factor: 1 / 25.4 },
      { unit: "ft", label: "Foot (ft)", factor: 1 / 304.8 },
    ],
  },
  {
    name: "Area",
    base: "mm²",
    units: [
      { unit: "mm²", label: "Square millimetre (mm²)", factor: 1 },
      { unit: "cm²", label: "Square centimetre (cm²)", factor: 0.01 },
      { unit: "m²", label: "Square metre (m²)", factor: 1e-6 },
      { unit: "in²", label: "Square inch (in²)", factor: 1 / 645.16 },
    ],
  },
  {
    name: "Volume",
    base: "cm³",
    units: [
      { unit: "cm³", label: "Cubic centimetre (cm³)", factor: 1 },
      { unit: "mm³", label: "Cubic millimetre (mm³)", factor: 1000 },
      { unit: "in³", label: "Cubic inch (in³)", factor: 1 / 16.387064 },
    ],
  },
  {
    name: "Mass",
    base: "g",
    units: [
      { unit: "g", label: "Gram (g)", factor: 1 },
      { unit: "kg", label: "Kilogram (kg)", factor: 0.001 },
      { unit: "oz", label: "Ounce (oz)", factor: 1 / 28.349523125 },
      { unit: "lb", label: "Pound (lb)", factor: 1 / 453.59237 },
    ],
  },
  {
    name: "Force",
    base: "kN",
    units: [
      { unit: "kN", label: "Kilonewton (kN)", factor: 1 },
      { unit: "N", label: "Newton (N)", factor: 1000 },
      { unit: "kgf", label: "Kilogram-force (kgf)", factor: 101.9716213 },
      { unit: "lbf", label: "Pound-force (lbf)", factor: 224.8089431 },
      { unit: "ton", label: "Metric ton-force (ton)", factor: 0.1019716213 },
      { unit: "US ton", label: "US ton-force (US ton)", factor: 0.1124044715 },
    ],
  },
  {
    name: "Pressure",
    base: "MPa",
    units: [
      { unit: "MPa", label: "Megapascal (MPa)", factor: 1 },
      { unit: "bar", label: "Bar (bar)", factor: 10 },
      { unit: "psi", label: "Pound per sq. inch (psi)", factor: 145.0377377 },
      { unit: "kg/cm²", label: "Kilogram per sq. cm (kg/cm²)", factor: 10.19716213 },
    ],
  },
  {
    name: "Temperature",
    base: "°C",
    units: [
      { unit: "°C", label: "Celsius (°C)", factor: 1, offset: 0 },
      { unit: "°F", label: "Fahrenheit (°F)", factor: 1.8, offset: 32 },
      { unit: "K", label: "Kelvin (K)", factor: 1, offset: 273.15 },
    ],
  },
  {
    name: "Time",
    base: "s",
    units: [
      { unit: "s", label: "Second (s)", factor: 1 },
      { unit: "min", label: "Minute (min)", factor: 1 / 60 },
      { unit: "h", label: "Hour (h)", factor: 1 / 3600 },
    ],
  },
]

/** Flat lookup so a stored `{unit, factor}` can be matched back to its preset. */
export function findPreset(unit: string, factor: number): UnitPreset | undefined {
  for (const g of UNIT_GROUPS) {
    for (const u of g.units) {
      // Factors are irrational for the imperial conversions, so compare loosely.
      if (u.unit === unit && Math.abs(u.factor - factor) < 1e-9) return u
    }
  }
  return undefined
}

export function groupOf(unit: string): UnitGroup | undefined {
  return UNIT_GROUPS.find((g) => g.units.some((u) => u.unit === unit))
}
