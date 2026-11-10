"use client"

import { useMemo, useRef, type CSSProperties } from "react"
import { draftMaterials } from "./draft-angle-data"
import { gates } from "./gate-size-data"
import { clamp, gateCategory, screenGate } from "./gate-size-model"
import { GateSchematic } from "./GateSchematic"
import { useCalculatorPreferences } from "./useCalculatorPreferences"
import theme from "./DraftAngleCalculator.module.css"
import styles from "./GateSizeCalculator.module.css"

const dimensions = {
  weight: {
    label: "Part Weight", detail: "Single molded part", initial: "30",
    metric: { unit: "g", factor: 1, min: 1, max: 1000, step: 1 },
    imperial: { unit: "oz", factor: 28.349523125, min: .04, max: 35.27, step: .01 },
  },
  wall: {
    label: "Nominal Wall Thickness", detail: "Near gate location", initial: "2.5",
    metric: { unit: "mm", factor: 1, min: .3, max: 20, step: .1 },
    imperial: { unit: "in", factor: 25.4, min: .012, max: .787, step: .001 },
  },
  flow: {
    label: "Flow Length", detail: "Gate to farthest fill point", initial: "150",
    metric: { unit: "mm", factor: 1, min: 10, max: 500, step: 5 },
    imperial: { unit: "in", factor: 25.4, min: .39, max: 19.69, step: .01 },
  },
}

const constraints = {
  geometry: {
    label: "Part Geometry", detail: "Activates geometry-specific gates",
    options: {
      general: "General / box-like", "flat-wide": "Wide / flat panel", "thin-wall": "Thin-wall part",
      thick: "Thick / bulky part", small: "Small compact part", "cyl-solid": "Cylindrical / solid-ended",
      "cyl-hole": "Cylindrical with central opening", annular: "Ring / annular part",
      "cosmetic-hidden": "Cosmetic part requiring hidden gate",
    },
  },
  runner: {
    label: "Runner System", detail: "Filter gate compatibility",
    options: { any: "No preference", cold: "Cold runner", hot: "Hot runner" },
  },
  degating: {
    label: "Degating Requirement", detail: "Manual or automatic",
    options: { any: "No preference", manual: "Manual degating acceptable", auto: "Automatic degating preferred" },
  },
  vestige: {
    label: "Gate Vestige", detail: "Cosmetic constraint",
    options: { any: "No special requirement", minimal: "Minimal vestige preferred", hidden: "Gate must be hidden if practical" },
  },
  multiple: {
    label: "Multiple Gates", detail: "Allow flow-path splitting",
    options: { yes: "Allowed", no: "Single gate only" },
  },
}

const defaultResin = draftMaterials.find((resin) => resin.abbr === "ABS") ?? draftMaterials[0]
const resinLabel = (resin: typeof defaultResin) => `${resin.name} — ${resin.abbr}`
const units = ["metric", "imperial"] as const
const defaults = {
  weight: dimensions.weight.initial, wall: dimensions.wall.initial, flow: dimensions.flow.initial,
  geometry: "general", runner: "any", degating: "any", vestige: "any", multiple: "yes",
  unitSystem: "metric" as (typeof units)[number],
  materialSearch: "", materialLabel: resinLabel(defaultResin), previewGate: "",
}

type Preferences = typeof defaults
type Dimension = keyof typeof dimensions
const dimensionKeys = Object.keys(dimensions) as Dimension[]
const constraintKeys = Object.keys(constraints) as (keyof typeof constraints)[]
const storageKey = "moldndie-gate-calculator-v1"

function restorePreferences(raw: string | null): Preferences {
  if (!raw) return defaults
  try {
    const saved = JSON.parse(raw) as Partial<Preferences> | null
    if (!saved) return defaults
    const state = { ...defaults }
    if (saved.unitSystem === "imperial") state.unitSystem = "imperial"
    for (const key of dimensionKeys) {
      const value = saved[key]
      if (typeof value === "string" && Number.isFinite(Number(value)) && Number(value) > 0) state[key] = value
    }
    for (const key of constraintKeys) {
      const value = saved[key]
      if (typeof value === "string" && Object.hasOwn(constraints[key].options, value)) state[key] = value
    }
    if (typeof saved.materialSearch === "string") state.materialSearch = saved.materialSearch
    const materialLabel = saved.materialLabel
    const previewGate = saved.previewGate
    if (materialLabel && draftMaterials.some((resin) => resinLabel(resin) === materialLabel)) state.materialLabel = materialLabel
    if (previewGate && gates.some((gate) => gate.name === previewGate)) state.previewGate = previewGate
    return state
  } catch {
    return defaults
  }
}

function metricValue(state: Preferences, key: Dimension) {
  const value = Number(state[key])
  return Number.isFinite(value) && value > 0
    ? value * dimensions[key][state.unitSystem].factor
    : Number(dimensions[key].initial)
}

export default function GateSizeCalculator() {
  const [state, change] = useCalculatorPreferences(storageKey, restorePreferences)
  const diagram = useRef<HTMLDivElement>(null)
  const imperial = state.unitSystem === "imperial"
  const resin = draftMaterials.find((item) => resinLabel(item) === state.materialLabel) ?? defaultResin
  const { groups, count } = useMemo(() => {
    const query = state.materialSearch.trim().toLowerCase()
    const matches = draftMaterials.filter((item) => `${item.name} ${item.abbr} ${item.category}`.toLowerCase().includes(query))
    const options = matches.includes(resin) ? matches : [resin, ...matches]
    const groups = new Map<string, typeof draftMaterials>()
    for (const item of options) {
      const group = groups.get(item.category)
      if (group) group.push(item)
      else groups.set(item.category, [item])
    }
    return { groups, count: matches.length }
  }, [resin, state.materialSearch])
  const result = screenGate({
    weightG: metricValue(state, "weight"),
    wallMm: metricValue(state, "wall"),
    flowMm: metricValue(state, "flow"),
    material: resin,
    geometry: state.geometry,
    runner: state.runner,
    degating: state.degating,
    vestige: state.vestige,
    multiple: state.multiple,
  })
  const top = result.ranked[0]
  const preview = state.previewGate || top.name
  const formatLength = (mm: number) => imperial ? `${(mm / 25.4).toFixed(3)} in` : `${mm.toFixed(2)} mm`

  function switchUnits(unitSystem: Preferences["unitSystem"]) {
    if (state.unitSystem === unitSystem) return
    const next = { ...state, unitSystem }
    for (const key of dimensionKeys) {
      const { factor } = dimensions[key][unitSystem]
      next[key] = String(Number((metricValue(state, key) / factor).toFixed(unitSystem === "imperial" ? 4 : 2)))
    }
    change(next)
  }

  function showGate(name: string) {
    change({ previewGate: name })
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    diagram.current?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "center" })
  }

  const breakdown = [
    ["Flow ratio L/t", `${result.ratio.toFixed(1)} : 1`],
    ["Resin flow behavior", result.profile.label],
    ["Screening reference", `${result.reference.toFixed(0)} : 1`],
    ["Flow demand / reference", `${Math.round(result.utilization * 100)}%`],
  ]
  const sizes = [
    ["Gate thickness", formatLength(result.thickness)],
    ["Gate width", formatLength(result.width)],
    ["Gate area", imperial ? `${(result.area / 25.4 ** 2).toFixed(4)} in²` : `${result.area.toFixed(2)} mm²`],
    ["Land length", formatLength(result.land)],
  ]
  const demand = result.utilization < .55 ? "Comfortable screening range"
    : result.utilization < .8 ? "Moderate flow demand"
    : result.utilization < 1 ? "Demanding flow path"
    : "High-risk flow path — verify grade data / Moldflow"

  return (
    <div className={theme.page}>
      <section className={theme.calculatorShell}>
        <header className={theme.intro}>
          <div>
            <p className={theme.kicker}>Free Engineering Tool</p>
            <h2>Configure the molded part and gate constraints</h2>
          </div>
          <div className={theme.unitSwitch} role="group" aria-label="Unit system">
            {units.map((unit) => (
              <button key={unit} type="button" aria-pressed={state.unitSystem === unit} className={state.unitSystem === unit ? theme.activeUnit : undefined} onClick={() => switchUnits(unit)}>
                {unit === "metric" ? "Metric" : "Imperial"}
              </button>
            ))}
          </div>
        </header>
        <div className={theme.calculatorGrid}>
          <div className={theme.inputPanel} role="group" aria-label="Gate calculator inputs">
            <div className={styles.inputGrid}>
              {dimensionKeys.map((key) => {
                const field = dimensions[key]
                const { unit, min, max, step } = field[state.unitSystem]
                const progress = clamp((Number(state[key]) - min) / (max - min) * 100, 0, 100)
                return (
                  <div className={theme.field} key={key}>
                    <label className={theme.fieldTop} htmlFor={`gate-${key}`}><strong>{field.label}</strong></label>
                    <div className={theme.numberWrap}>
                      <input id={`gate-${key}`} type="number" inputMode="decimal" min={min} max={max} step="any" value={state[key]} onChange={(event) => change({ [key]: event.target.value })} onBlur={() => change({ [key]: String(clamp(metricValue(state, key) / field[state.unitSystem].factor, min, max)) })} />
                      <span>{unit}</span>
                    </div>
                    <div className={`${theme.sliderBlock} ${styles.range}`}>
                      <input aria-label={`${field.label} slider`} type="range" min={min} max={max} step={step} value={state[key] || min} style={{ "--range-progress": `${progress}%` } as CSSProperties} onChange={(event) => change({ [key]: event.target.value })} />
                    </div>
                    <p className={styles.fieldHint}>{field.detail}</p>
                  </div>
                )
              })}
              <div className={`${theme.field} ${styles.fullWidth}`}>
                <label className={theme.fieldTop} htmlFor="gate-resin"><strong>Plastic Resin</strong></label>
                <input className={styles.searchInput} type="search" aria-label="Search resins" placeholder="Search resin name or abbreviation…" value={state.materialSearch} onChange={(event) => change({ materialSearch: event.target.value })} />
                <select id="gate-resin" value={state.materialLabel} onChange={(event) => change({ materialLabel: event.target.value })}>
                  {[...groups].map(([category, items]) => (
                    <optgroup key={category} label={category.replace(/(^|-)(\w)/g, (_, prefix, letter: string) => prefix + letter.toUpperCase())}>
                      {items.map((item) => <option key={resinLabel(item)} value={resinLabel(item)}>{resinLabel(item)}</option>)}
                    </optgroup>
                  ))}
                </select>
                <p className={styles.fieldHint} role="status">{count} matching {count === 1 ? "resin" : "resins"}</p>
              </div>
              {constraintKeys.map((key) => {
                const field = constraints[key]
                return (
                  <label className={theme.field} key={key}>
                    <span className={theme.fieldTop}><strong>{field.label}</strong></span>
                    <select value={state[key]} onChange={(event) => change({ [key]: event.target.value })}>
                      {Object.entries(field.options).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                    </select>
                    <span className={styles.fieldHint}>{field.detail}</span>
                  </label>
                )
              })}
            </div>
            <div className={theme.ruleNote}>
              <span aria-hidden="true">i</span>
              <p><strong>Engineering screening.</strong> Flow capability varies with the commercial grade, melt and mold temperatures, and injection pressure. Verify the selected grade with supplier data and molding simulation before releasing steel.</p>
            </div>
          </div>
          <aside className={theme.resultsPanel} aria-label="Gate calculator results">
            <div className={theme.liveLabel}><span /> Live calculation</div>
            <div className={`${theme.mainResult} ${styles.recommendation}`} aria-live="polite">
              <span>Top Gate Recommendation</span>
              <strong>{top.name}</strong>
              <small>{top.explanation}</small>
            </div>
            <dl className={theme.breakdown}>
              {breakdown.map(([label, value]) => <div className={theme.breakdownRow} key={label}><dt>{label}</dt><dd><strong>{value}</strong></dd></div>)}
            </dl>
            <dl className={`${theme.dimensionCard} ${styles.sizes}`}>
              {sizes.map(([label, value]) => <div key={label}><dt>{label}</dt><dd><strong>{value}</strong></dd></div>)}
            </dl>
            <div className={styles.flowMeter}>
              <strong>{demand}</strong>
              <meter min={0} max={100} value={clamp(result.utilization * 100, 0, 100)} aria-label="Flow demand against screening reference" />
              <span>{resin.name} ({resin.abbr})</span>
            </div>
            <dl className={theme.breakdown}>
              <div className={theme.breakdownRow}><dt>Estimated fill time</dt><dd><strong>{result.fill.toFixed(2)} sec</strong></dd></div>
              <div className={theme.breakdownRow}><dt>Estimated freeze-off</dt><dd><strong>{result.freeze.toFixed(2)} sec</strong></dd></div>
            </dl>
            <h3 className={`${theme.kicker} mt-5`}>Top five candidate gates</h3>
            <ol className={styles.ranking}>
              {result.ranked.slice(0, 5).map((gate, index) => (
                <li key={gate.name}>
                  <button type="button" className={styles.rankButton} aria-pressed={preview === gate.name} onClick={() => showGate(gate.name)}>
                    <span className={styles.rank}>{index + 1}</span>
                    <span><strong>{gate.name}</strong><small>{gate.family}</small></span>
                    <span className={styles.band}>{gateCategory(gate.score)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>
      <section aria-labelledby="gate-options">
        <div className={theme.sectionHeading}>
          <p className={theme.kicker}>Gate Selection</p>
          <h3 id="gate-options">Compatible gate options</h3>
          <p>Compare recommendations, suitable alternatives and choices that need extra verification. Select a gate to see its schematic.</p>
        </div>
        <div className={styles.cards}>
          {(["Recommended", "Suitable", "Conditional"] as const).map((band) => {
            const candidates = result.ranked.filter((gate) => gateCategory(gate.score) === band).slice(0, band === "Conditional" ? 10 : 8)
            return (
              <section className={styles.candidateColumn} key={band}>
                <h4>{band === "Conditional" ? "Conditional / verify" : band}</h4>
                {candidates.length ? candidates.map((gate) => (
                  <button className={styles.candidate} type="button" key={gate.name} aria-pressed={preview === gate.name} onClick={() => showGate(gate.name)}>
                    <strong>{gate.name}</strong><span>{gate.explanation}</span>
                  </button>
                )) : <p>No gate type fell in this band for the current inputs.</p>}
              </section>
            )
          })}
        </div>
        <div className={styles.diagram} ref={diagram}>
          <div className={theme.sectionHeading}>
            <p className={theme.kicker}>Technical Preview</p>
            <h3 aria-live="polite">{preview}</h3>
          </div>
          <GateSchematic name={preview} />
        </div>
      </section>
      <section aria-labelledby="gate-library">
        <div className={theme.sectionHeading}>
          <p className={theme.kicker}>Gate Library</p>
          <h3 id="gate-library">Gate types included in the recommendation engine</h3>
          <p>Browse all {gates.length} gate types and open any card to view its schematic.</p>
        </div>
        <div className={styles.cards}>
          {gates.map((gate) => (
            <button className={styles.libraryCard} type="button" aria-pressed={preview === gate.name} key={gate.name} onClick={() => showGate(gate.name)}>
              <strong>{gate.name}</strong><span>{gate.description}</span>
            </button>
          ))}
        </div>
      </section>
      <section aria-labelledby="gate-method">
        <div className={theme.sectionHeading}>
          <p className={theme.kicker}>Engineering Method</p>
          <h3 id="gate-method">How the recommendation is screened</h3>
          <p>The flow ratio is the first measure of demand. The chosen resin, part geometry, runner, degating, vestige limits and number of gates determine how the gate types rank.</p>
        </div>
        <div className={theme.formulaLayout}>
          <article><span>Flow Ratio</span><strong>L/t = Flow Length ÷ Wall Thickness</strong><p>Measure from the gate to the farthest fill point, and use the nominal wall thickness along that path.</p></article>
          <article><span>Selection Rule</span><strong>Resin + L/t + Geometry + Constraints</strong><p>Screen the candidate gates against all the inputs together.</p></article>
          <article><span>Validation</span><strong>Supplier grade data + CAE + molding trial</strong><p>Commercial grades can differ significantly even when their resin names are similar.</p></article>
        </div>
      </section>
    </div>
  )
}
