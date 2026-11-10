"use client"

import { memo, useMemo, useState, type CSSProperties, type ReactNode } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { draftMaterials, draftTextures } from "./draft-angle-data"
import { useCalculatorPreferences } from "./useCalculatorPreferences"
import styles from "./DraftAngleCalculator.module.css"

interface Option {
  label: string
  value: string
  values: Record<string, number | string>
}

const CATEGORY_LABELS: Record<string, string> = {
  commodity: "Commodity",
  engineering: "Engineering",
  "high-performance": "High-Performance",
  elastomer: "Elastomer",
  filled: "Filled",
  biodegradable: "Biodegradable",
  transparent: "Transparent",
  "flame-retardant": "Flame-Retardant",
}

const TEXTURE_STANDARD_LABELS: Record<string, string> = {
  VDI: "VDI 3400 (Complete)",
  SPI: "SPI Finish",
  MT: "Mold-Tech (MT)",
  YS: "Yick Sang (YS)",
  CH: "Charmilles (CH)",
}

const COLUMN_LABELS: Record<string, string> = {
  abbr: "Abbreviation",
  category: "Category",
  min_draft: "Min Draft",
  recommended_draft: "Recommended",
  max_draft: "Max Draft",
  note: "Notes",
  standard: "Standard",
  texture_depth_mm: "Depth (mm)",
  texture_depth_in: "Depth (mil)",
  texture_additional_draft: "Additional Draft",
  description: "Description",
}

const units = [
  { key: "metric", label: "Metric", unit: "mm", min: 1, max: 600, step: 1, factor: 1 },
  { key: "imperial", label: "Imperial", unit: "in", min: .04, max: 23.62, step: .01, factor: 25.4 },
] as const

const materialOptions: Option[] = draftMaterials.map((item, index) => ({
  label: item.name,
  value: String(index),
  values: {
    abbr: item.abbr, category: item.category, note: item.note,
    min_draft: item.min, recommended_draft: item.rec, max_draft: item.max,
  },
}))

const textureOptions: Option[] = draftTextures.map((item, index) => ({
  label: item.grade,
  value: String(index),
  values: {
    standard: item.standard, description: item.character, texture_depth_mm: item.depth,
    texture_depth_in: item.depthInDisplay, texture_additional_draft: item.draftDisplay,
  },
}))

const categories = [...new Set(draftMaterials.map((item) => item.category))]
const standards = [...new Set(draftTextures.map((item) => item.standard))]
const materialColumns = ["label", "abbr", "min_draft", "recommended_draft", "max_draft", "note"]
const textureColumns = ["standard", "label", "texture_depth_mm", "texture_depth_in", "texture_additional_draft", "description"]

const defaults = {
  unitSystem: "metric" as (typeof units)[number]["key"],
  materialSelect: String(draftMaterials.findIndex((item) => item.abbr === "ABS")),
  textureSelect: String(draftTextures.findIndex((item) => item.grade === "SPI A-1")),
  partDepth: "50",
  safetyToggle: true,
  coreToggle: false,
  materialSearch: "",
  textureSearch: "",
  materialCategoryFilter: "all",
  textureStandardFilter: "all",
}

type Preferences = typeof defaults

function restorePreferences(raw: string | null): Preferences {
  if (!raw) return defaults
  try {
    const saved = JSON.parse(raw) as Partial<Preferences> | null
    if (!saved) return defaults
    const next = { ...defaults }
    if (saved.unitSystem === "imperial") next.unitSystem = "imperial"
    if (materialOptions.some((option) => option.value === saved.materialSelect)) next.materialSelect = saved.materialSelect ?? defaults.materialSelect
    if (textureOptions.some((option) => option.value === saved.textureSelect)) next.textureSelect = saved.textureSelect ?? defaults.textureSelect
    if (typeof saved.partDepth === "string" && Number(saved.partDepth) > 0 && Number.isFinite(Number(saved.partDepth))) next.partDepth = saved.partDepth
    for (const key of ["safetyToggle", "coreToggle"] as const) {
      if (typeof saved[key] === "boolean") next[key] = saved[key]
    }
    for (const key of ["materialSearch", "textureSearch"] as const) {
      if (typeof saved[key] === "string") next[key] = saved[key]
    }
    if (saved.materialCategoryFilter && categories.includes(saved.materialCategoryFilter)) next.materialCategoryFilter = saved.materialCategoryFilter
    if (saved.textureStandardFilter && standards.includes(saved.textureStandardFilter)) next.textureStandardFilter = saved.textureStandardFilter
    return next
  } catch {
    return defaults
  }
}

function displayLabel(key: string) {
  return COLUMN_LABELS[key] ?? key
}

function formatAngle(value: number, decimals = 2) {
  return value.toFixed(decimals) + "°"
}

function normalizeSearch(text: string) {
  return text.normalize("NFKD").toLowerCase().replace(/[^a-z0-9.]+/g, " ").trim()
}

function matchesSearch(value: string, query: string) {
  const normalized = normalizeSearch(value)
  return query.split(" ").every((word) => normalized.includes(word)) ||
    normalized.replaceAll(" ", "").includes(query.replaceAll(" ", ""))
}

const ReferenceRows = memo(function ReferenceRows({ rows, columns, materials }: {
  rows: Option[]
  columns: string[]
  materials: boolean
}) {
  return (
    <tbody>
      {rows.map((option) => (
        <tr key={option.value}>
          {columns.map((key) => {
            const value = key === "label" ? option.label : option.values[key]
            if (key === "label" && materials) {
              return <td key={key} className={styles.materialCell}><strong>{option.label}</strong><span>{option.values.category}</span></td>
            }
            const shown = key === "texture_depth_mm" && typeof value === "number"
              ? value.toFixed(3)
              : ["min_draft", "recommended_draft", "max_draft"].includes(key) ? Number(value) + "°" : String(value ?? "—")
            return <td key={key} className={key === "recommended_draft" || key === "texture_additional_draft" ? styles.emphasis : undefined}>{shown}</td>
          })}
        </tr>
      ))}
      {rows.length === 0 && <tr><td colSpan={columns.length} className={styles.emptyCell}>No matching rows.</td></tr>}
    </tbody>
  )
})

export default function DraftAngleCalculator() {
  const [state, change] = useCalculatorPreferences("moldndie-draft-angle-calculator-v1", restorePreferences)
  const [sliderActive, setSliderActive] = useState(false)
  const system = state.unitSystem
  const depthUnit = system === "metric" ? units[0] : units[1]
  const drawDepth = Math.min(depthUnit.max, Math.max(depthUnit.min, Number(state.partDepth) || depthUnit.min))
  const drawDepthMm = drawDepth * depthUnit.factor
  const material = draftMaterials[Number(state.materialSelect)]
  const texture = draftTextures[Number(state.textureSelect)]
  const core = state.coreToggle ? .5 : 0
  const safety = state.safetyToggle ? .25 : 0
  const recommended = material.rec + texture.additionalDraft + core + safety
  const acceptableMin = material.min + texture.additionalDraft + core
  const acceptableMax = material.max + texture.additionalDraft + core + (state.safetyToggle ? .5 : 0)
  const offset = drawDepthMm * Math.tan(recommended * Math.PI / 180)
  const sideShift = Math.max(5, Math.min(70, recommended * 8))
  const depthProgress = (drawDepth - depthUnit.min) / (depthUnit.max - depthUnit.min) * 100
  const materialRows = useMemo(() => {
    const query = normalizeSearch(state.materialSearch)
    return materialOptions.filter((option) =>
      (state.materialCategoryFilter === "all" || option.values.category === state.materialCategoryFilter) &&
      matchesSearch(option.label + " " + Object.values(option.values).join(" "), query),
    )
  }, [state.materialCategoryFilter, state.materialSearch])
  const textureRows = useMemo(() => {
    const query = normalizeSearch(state.textureSearch)
    return textureOptions.filter((option) =>
      (state.textureStandardFilter === "all" || option.values.standard === state.textureStandardFilter) &&
      matchesSearch(option.label + " " + Object.values(option.values).join(" "), query),
    )
  }, [state.textureStandardFilter, state.textureSearch])

  function switchSystem(next: (typeof units)[number]) {
    if (next.key === system) return
    const converted = Math.min(next.max, Math.max(next.min, drawDepthMm / next.factor))
    change({ unitSystem: next.key, partDepth: String(Number(converted.toFixed(next.key === "metric" ? 2 : 3))) })
  }

  function formatLength(mm: number) {
    return (mm / depthUnit.factor).toFixed(system === "metric" ? 2 : 3) + " " + depthUnit.unit
  }

  function renderReferenceTable(title: string, chart: string, rows: Option[], columns: string[], query: string, onQuery: (value: string) => void, countLabel: string, filterControl: ReactNode) {
    const materials = countLabel === "materials"
    return (
      <section className={styles.referenceCard}>
        <div className={styles.referenceHeader}>
          <div>
            <span className={styles.chartNumber}>{chart}</span>
            <h3>{title}</h3>
            <p>Showing {rows.length} {countLabel}</p>
          </div>
          <div className={styles.tableFilters}>
            {filterControl}
            <label className={styles.searchBox}>
              <Search aria-hidden="true" size={15} />
              <span className={styles.srOnly}>Search {title.toLowerCase()}</span>
              <Input type="search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder={materials ? "Type to search..." : "Search by name or depth..."} />
            </label>
          </div>
        </div>
        <div className={styles.tableScroller}>
          <table className={styles.dataTable}>
            <thead>
              <tr>{columns.map((key) => <th key={key} scope="col">{key === "label" ? (materials ? "Material" : "Class/Grade") : displayLabel(key)}</th>)}</tr>
            </thead>
            <ReferenceRows rows={rows} columns={columns} materials={materials} />
          </table>
        </div>
      </section>
    )
  }

  return (
    <div className={styles.page}>
      <section className={styles.calculatorShell}>
        <header className={styles.intro}>
          <div>
            <p className={styles.kicker}>Free Engineering Tool</p>
            <h2>Configure the molded feature</h2>
          </div>
          <div className={styles.actions}>
            <div className={styles.unitSwitch} role="group" aria-label="Unit system">
              {units.map((unit) => (
                <button key={unit.key} type="button" aria-pressed={system === unit.key} className={system === unit.key ? styles.activeUnit : ""} onClick={() => switchSystem(unit)}>
                  {unit.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className={styles.calculatorGrid}>
          <form className={styles.inputPanel} onSubmit={(event) => event.preventDefault()}>
            <label className={styles.field}>
              <span className={styles.fieldTop}><strong>Material Type</strong><small>Resin behavior affects mold release</small></span>
              <select value={state.materialSelect} onChange={(event) => change({ materialSelect: event.target.value })}>
                {categories.map((category) => (
                  <optgroup key={category} label={CATEGORY_LABELS[category] ?? category}>
                    {materialOptions.filter((option) => String(option.values?.category ?? "").toLowerCase() === category).map((option) => (
                      <option key={option.value} value={option.value}>{option.values?.abbr ? `${option.values.abbr} — ` : ""}{option.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldTop}><strong>Surface Texture / Finish</strong><small>Uses the selected finish’s reference value</small></span>
              <select value={state.textureSelect} onChange={(event) => change({ textureSelect: event.target.value })}>
                {standards.map((standard) => (
                  <optgroup key={standard} label={standard}>
                    {textureOptions.filter((option) => option.values?.standard === standard).map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <div className={styles.field}>
              <label htmlFor="draft-draw-depth" className={styles.fieldTop}><strong>Part Depth</strong><small>Depth in the mold-opening direction</small></label>
              <span className={styles.numberWrap}>
                <input id="draft-draw-depth" type="number" min={depthUnit.min} max={depthUnit.max} step={depthUnit.step} value={state.partDepth} onChange={(event) => change({ partDepth: event.target.value })} onBlur={() => change({ partDepth: String(drawDepth) })} />
                <span>{depthUnit.unit}</span>
              </span>
              <div className={styles.sliderBlock}>
                <output className={`${styles.sliderBubble} ${sliderActive ? styles.sliderBubbleVisible : ""}`} style={{ left: `${depthProgress}%` }} htmlFor="draft-depth-slider" aria-live="polite">{Number(drawDepth.toFixed(2)).toString()} {depthUnit.unit}</output>
                <input id="draft-depth-slider" aria-label="Part depth slider" type="range" min={depthUnit.min} max={depthUnit.max} step={depthUnit.step} value={drawDepth} style={{ "--range-progress": `${depthProgress}%` } as CSSProperties} onChange={(event) => change({ partDepth: event.target.value })} onPointerDown={() => setSliderActive(true)} onPointerUp={() => setSliderActive(false)} onPointerCancel={() => setSliderActive(false)} onBlur={() => setSliderActive(false)} onKeyUp={() => setSliderActive(false)} />
              </div>
            </div>

            <div className={styles.optionsBlock}>
              <div className={styles.optionsTitle}><strong>Calculation Options</strong><span>Toggle allowances used in the recommendation</span></div>
              {([
                ["safetyToggle", "Add safety factor", "+0.25° to the recommendation"],
                ["coreToggle", "Core-side feature", "+0.50° for internal features"],
              ] as const).map(([key, label, description]) => (
                <label className={styles.toggleRow} key={key}>
                  <span><strong>{label}</strong><small>{description}</small></span>
                  <input type="checkbox" checked={state[key]} onChange={(event) => change({ [key]: event.target.checked })} />
                  <span className={styles.toggleUi} aria-hidden="true" />
                </label>
              ))}
            </div>

            <div className={styles.ruleNote}>
              <span aria-hidden="true">i</span>
              <p><strong>Texture allowance:</strong> the selected finish supplies its draft allowance from the reference table. Internal/core-side features receive an additional +0.5°.</p>
            </div>
          </form>

          <aside className={styles.resultsPanel} aria-live="polite">
            <div className={styles.liveLabel}><span /> Live calculation</div>
            <div className={styles.mainResult}>
              <span>Recommended Draft Angle</span>
              <strong>{formatAngle(recommended)}</strong>
              <small>Acceptable range: {`${acceptableMin.toFixed(1)}° to ${acceptableMax.toFixed(1)}°`}</small>
            </div>
            <div className={styles.breakdown}>
              {[
                ["Base material draft", formatAngle(material.rec)],
                ["Texture addition", formatAngle(texture.additionalDraft)],
                ["Core-side addition", formatAngle(core)],
                ["Safety factor", formatAngle(safety)],
              ].map(([label, value]) => <div className={styles.breakdownRow} key={label}><span>{label}</span><strong>{value}</strong></div>)}
            </div>
            <div className={styles.dimensionCard}>
            <div><span>Per-side offset at full depth</span><strong>{formatLength(offset)}</strong></div>
              <div><span>Total width change</span><strong>{formatLength(2 * offset)}</strong></div>
            </div>
            <div className={`${styles.advisory} ${drawDepthMm > 180 ? styles.advisoryWatch : drawDepthMm > 100 ? styles.advisoryWatch : styles.advisoryGood}`}>
              <strong>{drawDepthMm > 180 ? "Deep-draw review recommended" : drawDepthMm > 100 ? "Check deep-wall release" : "Good starting range"}</strong>
              <span>{drawDepthMm > 180 ? "This feature is over 180 mm deep. Review ejection force, cooling, shrinkage, surface finish and whether more draft is possible." : drawDepthMm > 100 ? "The draw exceeds 100 mm. Longer contact length can raise friction even when the calculated angle looks acceptable." : "Validate the selected material, texture and actual mold geometry before releasing steel."}</span>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.visualSection}>
        <div className={styles.sectionHeading}><p className={styles.kicker}>Geometry Preview</p><h3>Draft angle visualization</h3><p>The graphic exaggerates the taper so the draft direction is easy to read. Dimension values below use your actual calculated angle and draw depth.</p></div>
        <div className={styles.visualCard}>
          <div className={styles.svgWrap}>
            <svg viewBox="0 0 700 350" role="img" aria-label={`Draft angle visualization, ${formatAngle(recommended)} draft`}>
              <defs><pattern id="steelPattern" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 12 L12 0" stroke="currentColor" strokeOpacity=".08" strokeWidth="1" /></pattern></defs>
              <rect x="40" y="40" width="620" height="270" rx="18" fill="#f1f2f3" stroke="#d9dcdf" />
              <rect x="40" y="40" width="620" height="270" rx="18" fill="url(#steelPattern)" />
              <path d={`M${250 + sideShift} 80 L${450 - sideShift} 80 L490 280 L210 280 Z`} fill="#e7e9eb" stroke="#a5abb1" strokeWidth="2" />
              <line x1="350" y1="60" x2="350" y2="300" stroke="#9299a0" strokeDasharray="6 6" strokeWidth="2" />
              <path d="M350 75 L350 30 M340 43 L350 28 L360 43" fill="none" stroke="#687079" strokeWidth="2" />
              <path d={`M${250 + sideShift} 115 A42 42 0 0 1 ${257 + sideShift} 85`} fill="none" stroke="#760618" strokeWidth="3" />
              <text x="185" y="125" fill="#3c4248" fontSize="16" fontWeight="800">{formatAngle(recommended)}</text>
              <line x1="205" y1="80" x2="205" y2="280" stroke="#687079" strokeWidth="2" />
              <line x1="195" y1="80" x2="215" y2="80" stroke="#687079" strokeWidth="2" />
              <line x1="195" y1="280" x2="215" y2="280" stroke="#687079" strokeWidth="2" />
              <text x="105" y="185" fill="#3c4248" fontSize="14" fontWeight="700">{drawDepth.toFixed(system === "metric" ? 0 : 2)} {depthUnit.unit} depth</text>
              <text x="373" y="48" fill="#737a81" fontSize="11" fontWeight="800">EJECTION / DRAW</text>
              <text x="350" y="190" textAnchor="middle" fill="#5c1515" fontSize="14" fontWeight="900">PART</text>
              <text x="65" y="292" fill="#737a81" fontSize="11" fontWeight="800">MOLD STEEL</text>
            </svg>
          </div>
          <div className={styles.visualMetrics}>
            <div><span>Angle per side</span><strong>{formatAngle(recommended)}</strong></div>
            <div><span>Offset per side</span><strong>{formatLength(offset)}</strong></div>
            <div><span>Width difference</span><strong>{formatLength(2 * offset)}</strong></div>
          </div>
        </div>
      </section>

      <section className={styles.referenceSection}>
        <div className={styles.sectionHeading}><p className={styles.kicker}>Reference Data</p><h3>Draft angle reference charts</h3><p>Browse {materialOptions.length} material entries and {textureOptions.length} surface-texture references. Final draft should be confirmed against your resin supplier data, texture specification, geometry, ejection method and toolmaker requirements.</p></div>
        <div className={styles.tablesGrid}>
          {renderReferenceTable("Draft Angle by Material Type", "Chart 01", materialRows, materialColumns, state.materialSearch, (materialSearch) => change({ materialSearch }), "materials", <label className={styles.filterSelect}><span>Filter by Category</span><select value={state.materialCategoryFilter} onChange={(event) => change({ materialCategoryFilter: event.target.value })}><option value="all">All Categories</option>{categories.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category] ?? category}</option>)}</select></label>)}
          {renderReferenceTable("Additional Draft for Surface Texture", "Chart 02", textureRows, textureColumns, state.textureSearch, (textureSearch) => change({ textureSearch }), "textures", <label className={styles.filterSelect}><span>Texture Standard</span><select value={state.textureStandardFilter} onChange={(event) => change({ textureStandardFilter: event.target.value })}><option value="all">All Standards</option>{standards.map((standard) => <option key={standard} value={standard}>{TEXTURE_STANDARD_LABELS[standard] ?? standard}</option>)}</select></label>)}
        </div>
        <p className={styles.tableNote}><strong>Industry rule of thumb:</strong> add 1° of draft per 0.025 mm (0.001 in) of texture depth.</p>
      </section>
      <EngineeringGuide />
      <DraftFaq />
      <section className={styles.ctaSection}><div className={styles.ctaCard}><div><p className={styles.kicker}>MoldNDie Engineering</p><h3>Use the calculator as a starting point, then validate the tool.</h3><p>Browse MoldNDie engineering resources for additional injection-mold, die-casting and sheet-metal design tools.</p></div><Link href="/tools">Explore Engineering Tools</Link></div></section>
    </div>
  )
}

function EngineeringGuide() {
  return (
    <section className={styles.guideSection}>
      <div className={styles.sectionHeading}>
        <p className={styles.kicker}>Engineering Guide</p>
        <h3>Why draft angle matters in injection molding</h3>
        <p>Draft is the small taper applied to surfaces that run in the mold-opening direction. It reduces sliding contact during ejection, lowers the force needed to release the part and helps protect both the molded surface and the tool.</p>
      </div>
      <div className={styles.guideGrid}>
        <article><span>01</span><h4>Cavity side / external walls</h4><p>As many plastics cool, they tend to pull away from cavity-side surfaces. Smooth external walls can therefore often work with relatively modest draft, provided the draw is not unusually deep.</p></article>
        <article><span>02</span><h4>Core side / internal walls</h4><p>Cooling plastic contracts around cores, ribs and bosses. That grip increases ejection load, so internal features commonly need more draft than equivalent external surfaces.</p></article>
        <article><span>03</span><h4>Textured surfaces</h4><p>Texture peaks and valleys increase mechanical engagement with the molded plastic. Deeper textures normally require additional taper to avoid dragging, whitening or damaging the surface during ejection.</p></article>
        <article><span>04</span><h4>Deep draws</h4><p>Taller walls create more contact area and more cumulative friction. Features deeper than roughly 100 mm deserve additional scrutiny; many designs benefit from at least 1.5°–2° when geometry allows.</p></article>
      </div>
      <div className={styles.formulaLayout}>
        <article><span>Draft Calculation</span><strong>Total Draft = Base + Texture + Core + Safety</strong><p>Base comes from the selected resin. Preset textures use their stored source-table draft value. Core and safety allowances are controlled by the switches in the calculator.</p></article>
        <article><span>Texture Depth Rule</span><strong>Texture Add = Texture Depth ÷ 0.025 mm</strong><p>Each 0.025 mm (0.001 in) of texture depth adds 1° of draft.</p></article>
        <article><span>Dimensional Change</span><strong>ΔW = 2 × D × tan(θ)</strong><p>D is the draw depth and θ is draft per side. ΔW estimates the total width difference between the top and bottom of two equally drafted walls.</p></article>
      </div>
      <div className={styles.engineeringCopy}>
        <h4>Material behavior changes the answer</h4>
        <p>Low-friction engineering resins such as acetal and nylon can often release with relatively small draft on polished steel. High-shrinkage resins can grip internal cores more strongly, while elastomeric materials may need significantly larger angles because they deform and drag instead of sliding cleanly.</p>
        <p>Filled compounds also deserve special attention. Glass fibers change shrinkage, stiffness and abrasion behavior, so the final value should come from the material data sheet and the toolmaker’s experience rather than from a generic table alone.</p>
        <h4>Ribs, bosses, holes and shut-offs</h4>
        <p>Narrow core features are often more sensitive to insufficient draft than broad external walls. Add draft to rib faces, both sides of bosses and cored holes in the direction that releases the part. Steel-to-steel shut-off faces generally need a much steeper angle than ordinary molded walls to limit wear and flashing.</p>
        <h4>What can go wrong with too little draft?</h4>
        <ul><li>High ejector force and bent or overloaded ejector pins.</li><li>Drag marks, scuffing, gloss changes or stress whitening.</li><li>Part distortion as the molding is forced away from the steel.</li><li>Longer cycles because the part must cool more before it can release.</li><li>Accelerated tool wear and unstable production over long runs.</li></ul>
        <div className={styles.engineeringWarning}><strong>Design reminder</strong><p>Zero draft is possible only in limited situations and normally carries a production penalty. Even a small taper can materially improve ejection reliability. Treat this calculator as a DFM aid, not as final tooling approval.</p></div>
      </div>
    </section>
  )
}

const FAQS = [
  ["What is a practical minimum draft angle for injection molding?", "There is no single minimum for every part. Highly polished, shallow features in low-friction materials may work around 0.25°–0.5° per side, while 1° is a more comfortable starting point for many general-purpose applications. Texture, depth, resin shrinkage and whether the feature is on the core side can all increase the requirement."],
  ["How is draft estimated for a textured surface?", "Start with the resin’s base draft, then add an allowance for texture depth. A widely used early-design rule is about 1° for every 0.025 mm, or 0.001 in, of texture depth. Always check the exact VDI, SPI or texture-supplier recommendation before cutting steel."],
  ["Why do internal core-side features usually need more draft?", "Plastic contracts as it cools. On an external cavity surface it can pull away, but around an internal core it tends to shrink onto the steel. This creates extra gripping force on cores, ribs, bosses and cored holes, which is why the calculator can add a separate core-side allowance."],
  ["Can an injection-molded feature have zero draft?", "It can be technically feasible for very short, polished features with suitable materials and ejection design, but it usually increases ejection force, mold wear and cosmetic risk. Production parts should use positive draft wherever the product geometry permits."],
  ["How does draft affect wall dimensions?", "A drafted wall is tapered, so its width changes over the draw depth. The per-side dimensional offset is D × tan(θ), and two equally drafted opposite walls change by approximately 2 × D × tan(θ). The calculator reports both values so you can see the geometric impact."],
  ["Do ribs and bosses need draft?", "Yes. Ribs and bosses are commonly formed by narrow core features and can grip the tool strongly. Draft should run in the release direction and be checked together with rib thickness, boss geometry, ejection layout and material shrinkage."],
] as const

function DraftFaq() {
  return (
    <section className={styles.faqSection}>
      <div className={styles.sectionHeading}><p className={styles.kicker}>FAQ</p><h3>Draft angle questions</h3></div>
      <div className={styles.faqList}>
        {FAQS.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}</summary><p>{answer}</p></details>)}
      </div>
    </section>
  )
}
