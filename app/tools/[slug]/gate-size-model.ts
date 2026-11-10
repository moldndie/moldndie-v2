import { gates, type Gate } from "./gate-size-data"
import { draftMaterials } from "./draft-angle-data"

type Resin = (typeof draftMaterials)[number]

export interface GateInputs {
  weightG: number
  wallMm: number
  flowMm: number
  material: Resin
  geometry: string
  runner: string
  degating: string
  vestige: string
  multiple: string
}

const flowProfiles = [
  [/LCP/, 1.55, .5],
  [/PP-H|PP-C|PP-R|BIO-PE|HDPE|LDPE|LLDPE|TPO/, 1.35, .32],
  [/PA6|PA66|PA11|PA12|PA46|PA610|PA612|POM-H|POM-C/, 1.28, .38],
  [/GPPS|HIPS|SAN|PS-CRYSTAL|SMMA/, 1.12, .45],
  [/ABS|ASA|PC\/ABS/, 1.02, .48],
  [/PC-HF/, 1.05, .58],
  [/PC-O|POLYCARBONATE|\bPC\b/, .82, .68],
  [/PMMA|COC|COP|MBS/, .9, .68],
  [/PBT|PETG|PET|PTT/, .95, .52],
  [/PPS|PEEK|PEKK|PEK|PEI|PAI|PSU|PESU|PPSU|PBI|PI/, .78, .62],
  [/PVC/, .74, .78],
  [/TPE|TPU|TPV|SEBS|SBS|PEBA|EVA|EPDM|LSR|TPC|TPA/, .88, .66],
] as const

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function resinProfile(resin: Resin) {
  const name = `${resin.name} ${resin.abbr}`.toUpperCase()
  const [, flow = 1, shear = .45] = flowProfiles.find(([pattern]) => pattern.test(name)) ?? []
  let flowFactor = flow as number
  let shearSensitivity = shear as number
  for (const [pattern, flowScale, shearAddition] of [
    [/GF|CF|GLASS FILLED|CARBON FILLED/, .78, .16],
    [/TALC|MINERAL/, .88, .08],
    [/FLAME RETARDANT|\bFR\b/, .9, .06],
  ] as const) {
    if (pattern.test(name)) {
      flowFactor *= flowScale
      shearSensitivity = Math.min(1, shearSensitivity + shearAddition)
    }
  }
  return {
    flowFactor: clamp(flowFactor, .55, 1.6),
    shearSensitivity: clamp(shearSensitivity, .2, 1),
    filled: /GF|CF|TALC|MINERAL|FILLED/.test(name),
    label: flowFactor >= 1.25 ? "High flow" : flowFactor >= 1 ? "Medium-high flow" : flowFactor >= .82 ? "Medium flow" : "Lower flow / higher pressure demand",
  }
}

type ResinProfile = ReturnType<typeof resinProfile>

// Scoring weights and equations are carried over from the supplied gate calculator.
function scoreGate(gate: Gate, input: GateInputs, profile: ResinProfile, severity: number) {
  const capacityNeed = .55 + severity * .9
  let score = 62 - Math.max(0, capacityNeed - gate.cap) * 65
  if (gate.cap > capacityNeed + .65) score -= 8
  if (gate.geoms.includes(input.geometry)) score += 18
  else if (input.geometry !== "general") score -= 10
  if (input.runner !== "any") score += gate.runner === input.runner ? 16 : -28
  if (input.degating !== "any") score += gate.degating === input.degating ? 12 : -14
  if (input.vestige === "hidden") score += gate.hidden || gate.name.includes("Internal") ? 18 : -12
  if (input.vestige === "minimal") {
    if (gate.degating === "auto" || gate.runner === "hot") score += 8
    if (/Sprue|Film|Flash/.test(gate.name)) score -= 14
  }
  if (input.multiple === "no" && gate.multi) score -= 55
  if (input.multiple === "yes" && gate.multi && severity > .75) score += 14
  if (profile.shearSensitivity > .62) score -= (gate.shear - .25) * 26
  if (/Pinpoint|Tunnel|Cashew|Restricted/.test(gate.name)) {
    if (profile.filled) score -= 14
    if (input.weightG > 450) score -= 16
  }
  if (input.wallMm < 1.2 && /Fan|Film|Flash|Valve|Multiple/.test(gate.name)) score += 9
  if (input.wallMm > 4 && /Sprue|Edge|Valve|Chisel/.test(gate.name)) score += 8
  if ((input.geometry === "cyl-hole" || input.geometry === "annular") && gate.family === "Circular") score += 24
  if ((input.geometry === "flat-wide" || input.geometry === "thin-wall") && /Fan|Film|Flash/.test(gate.name)) score += 16
  return score
}

function explainGate(gate: Gate, profile: ResinProfile) {
  const explanation = [gate.why]
  if (profile.filled && /Fan|Film|Edge|Valve/.test(gate.name)) {
    explanation.push("Its larger flow section is favorable for filled compounds.")
  }
  if (profile.shearSensitivity > .62 && gate.shear > .65) {
    explanation.push("Check melt shear carefully for this resin.")
  }
  if (gate.multi) {
    explanation.push("Multiple gates can reduce effective flow length but may introduce weld lines.")
  }
  return explanation.join(" ")
}

export function gateCategory(score: number) {
  if (score >= 78) return "Recommended"
  if (score >= 62) return "Suitable"
  if (score >= 45) return "Conditional"
  return "Not preferred"
}

export function screenGate(input: GateInputs) {
  const profile = resinProfile(input.material)
  const ratio = input.flowMm / input.wallMm
  const reference = 160 * profile.flowFactor
  const utilization = ratio / reference
  const severity = clamp(utilization, 0, 1.6)
  const gateRatio = clamp(.78 - .18 * profile.flowFactor + (profile.filled ? .06 : 0), .48, .86)
  const thickness = clamp(input.wallMm * gateRatio, .3, input.wallMm * .9)
  const width = clamp(
    Math.sqrt(input.weightG * .7 / Math.max(thickness, .3)),
    Math.max(thickness * 1.5, 1),
    Math.max(25, thickness * 12),
  )
  const area = thickness * width
  const land = clamp(thickness * .75, .5, 2.5)
  const fill = input.flowMm * input.weightG / (Math.max(area, .1) * 180) * clamp(1.25 / profile.flowFactor, .7, 1.8)
  const freeze = 2.35 * thickness * thickness
  const ranked = gates.map((gate) => ({
    ...gate,
    score: scoreGate(gate, input, profile, severity),
    explanation: explainGate(gate, profile),
  })).sort((first, second) => second.score - first.score)

  return { profile, ratio, reference, utilization, thickness, width, area, land, fill, freeze, ranked }
}
