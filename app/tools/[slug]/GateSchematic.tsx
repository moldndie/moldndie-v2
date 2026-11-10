import type { ReactNode } from "react"

function Part() {
  return (
    <>
      <rect x="360" y="100" width="230" height="130" rx="8" className="gate-svg-part" />
      <text x="457" y="170" className="gate-svg-label">PART</text>
    </>
  )
}

// One schematic for each entry in the supplied gate library.
const diagrams: Record<string, { caption: string; art: ReactNode }> = {
  "Direct Sprue Gate": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M475 58v42" className="gate-svg-runner" />
      <path d="M458 58h34l-9 42h-16z" className="gate-svg-gate" />
      <path d="M475 70v52" className="gate-svg-flow" />
      <text x="500" y="82" className="gate-svg-label">SPRUE</text>
      <text x="486" y="117" className="gate-svg-note">DIRECT GATE</text>
    </>
  ) },
  "Edge / Side Gate": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M92 165H325" className="gate-svg-runner" />
      <rect x="325" y="154" width="35" height="22" rx="2" className="gate-svg-gate" />
      <path d="M130 165H410" className="gate-svg-flow" />
      <text x="105" y="145" className="gate-svg-label">RUNNER</text>
      <text x="312" y="196" className="gate-svg-note">EDGE</text>
    </>
  ) },
  "Internal Edge Gate": { caption: "SECTION VIEW", art: (
    <>
      <path d="M360 100h230v130H360z M430 135h90v60h-90z" fillRule="evenodd" className="gate-svg-part" />
      <path d="M92 205H410V184" className="gate-svg-runner" />
      <rect x="402" y="174" width="20" height="28" className="gate-svg-gate" />
      <path d="M130 205H410V175" className="gate-svg-flow" />
      <text x="103" y="185" className="gate-svg-label">RUNNER</text>
      <text x="427" y="168" className="gate-svg-note">INTERNAL EDGE</text>
    </>
  ) },
  "Tab Gate": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M88 165H270" className="gate-svg-runner" />
      <rect x="270" y="132" width="60" height="66" rx="4" fill="#f1d9dd" stroke="#760618" strokeWidth="2" />
      <rect x="330" y="157" width="30" height="16" className="gate-svg-gate" />
      <path d="M120 165H405" className="gate-svg-flow" />
      <text x="279" y="126" className="gate-svg-note">TAB</text>
      <text x="101" y="145" className="gate-svg-label">RUNNER</text>
    </>
  ) },
  "Overlap Gate": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M90 202H335" className="gate-svg-runner" />
      <path d="M320 202h50v-28h35v18h-18v10h-67z" className="gate-svg-gate" />
      <path d="M125 202H370V182H420" className="gate-svg-flow" />
      <text x="104" y="183" className="gate-svg-label">RUNNER</text>
      <text x="312" y="229" className="gate-svg-note">OVERLAP</text>
    </>
  ) },
  "Fan Gate": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M90 165H265" className="gate-svg-runner" />
      <path d="M265 153 L360 122 L360 208 L265 177 Z" className="gate-svg-gate" />
      <path d="M120 165H430" className="gate-svg-flow" />
      <text x="276" y="116" className="gate-svg-note">FAN</text>
      <text x="105" y="145" className="gate-svg-label">RUNNER</text>
    </>
  ) },
  "Film Gate": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M90 165H270" className="gate-svg-runner" />
      <rect x="270" y="112" width="90" height="106" rx="3" className="gate-svg-gate" opacity=".9" />
      <path d="M120 165H430" className="gate-svg-flow" />
      <text x="285" y="102" className="gate-svg-note">WIDE FILM ENTRY</text>
      <text x="104" y="145" className="gate-svg-label">RUNNER</text>
    </>
  ) },
  "Flash Gate": { caption: "SECTION VIEW", art: (
    <>
      <rect x="360" y="88" width="230" height="154" rx="8" className="gate-svg-part" />
      <path d="M90 165H250" className="gate-svg-runner" />
      <path d="M250 146H360V184H250Z" className="gate-svg-gate" />
      <path d="M120 165H440" className="gate-svg-flow" />
      <path d="M360 100v130" className="gate-svg-dim" />
      <text x="268" y="138" className="gate-svg-note">FLASH / FULL-WIDTH ENTRY</text>
    </>
  ) },
  "Chisel Gate": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M92 165H295" className="gate-svg-runner" />
      <path d="M295 143 L360 165 L295 187 Z" className="gate-svg-gate" />
      <path d="M125 165H420" className="gate-svg-flow" />
      <text x="295" y="132" className="gate-svg-note">CHISEL</text>
    </>
  ) },
  "Restricted Edge Gate": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M92 165H338" className="gate-svg-runner" />
      <rect x="338" y="160" width="22" height="10" rx="2" className="gate-svg-gate" />
      <path d="M125 165H420" className="gate-svg-flow" />
      <text x="296" y="148" className="gate-svg-note">RESTRICTED EDGE</text>
    </>
  ) },
  "Pinpoint / Pin Gate": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M475 55v64" className="gate-svg-runner" />
      <circle cx="475" cy="119" r="8" className="gate-svg-gate" />
      <path d="M467 119l8 18 8-18z" className="gate-svg-gate" />
      <path d="M475 70V160" className="gate-svg-flow" />
      <text x="495" y="90" className="gate-svg-label">PIN RUNNER</text>
      <text x="493" y="136" className="gate-svg-note">PINPOINT</text>
    </>
  ) },
  "Tunnel / Submarine Gate": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M90 225H245" className="gate-svg-runner" />
      <path d="M245 225 L358 178" className="gate-svg-runner-thin" />
      <circle cx="358" cy="178" r="8" className="gate-svg-gate" />
      <path d="M120 225L350 181" className="gate-svg-flow" />
      <text x="95" y="205" className="gate-svg-label">RUNNER</text>
      <text x="242" y="242" className="gate-svg-note">ANGLED SUBMARINE TUNNEL</text>
    </>
  ) },
  "Curved Tunnel Gate": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M90 225H230" className="gate-svg-runner" />
      <path d="M230 225 C280 225 282 180 318 176 C340 174 347 160 360 150" className="gate-svg-runner-thin" />
      <path d="M120 225C285 225 290 175 355 153" className="gate-svg-flow" />
      <text x="224" y="248" className="gate-svg-note">CURVED TUNNEL</text>
    </>
  ) },
  "Cashew / Banana Gate": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M90 230H220" className="gate-svg-runner" />
      <path d="M220 230 C300 250 335 250 346 210 C353 184 344 164 360 150" className="gate-svg-runner-thin" />
      <path d="M120 230C300 255 345 230 360 153" className="gate-svg-flow" />
      <text x="220" y="266" className="gate-svg-note">CASHEW / BANANA PATH</text>
    </>
  ) },
  "Diaphragm Gate": { caption: "TOP VIEW", art: (
    <>
      <circle cx="470" cy="165" r="92" className="gate-svg-part" />
      <circle cx="470" cy="165" r="44" fill="#fff" stroke="#444a50" strokeWidth="2" />
      <circle cx="470" cy="165" r="53" fill="none" stroke="#760618" strokeWidth="13" />
      <path d="M120 165H417" className="gate-svg-runner" />
      <path d="M150 165H440" className="gate-svg-flow" />
      <text x="438" y="58" className="gate-svg-note">360° DIAPHRAGM</text>
      <text x="453" y="171" className="gate-svg-label">HOLE</text>
    </>
  ) },
  "Ring Gate": { caption: "TOP VIEW", art: (
    <>
      <circle cx="470" cy="165" r="92" className="gate-svg-part" />
      <circle cx="470" cy="165" r="56" fill="#fff" stroke="#444a50" strokeWidth="2" />
      <circle cx="470" cy="165" r="98" fill="none" stroke="#760618" strokeWidth="12" />
      <path d="M120 165H372" className="gate-svg-runner" />
      <path d="M150 165H382" className="gate-svg-flow" />
      <text x="432" y="49" className="gate-svg-note">ANNULAR RING GATE</text>
    </>
  ) },
  "Disk Gate": { caption: "TOP VIEW", art: (
    <>
      <circle cx="470" cy="165" r="98" className="gate-svg-part" />
      <circle cx="470" cy="165" r="52" fill="#760618" opacity=".9" />
      <circle cx="470" cy="165" r="18" fill="#fff" stroke="#444a50" strokeWidth="2" />
      <path d="M120 165H452" className="gate-svg-runner" />
      <path d="M150 165H445" className="gate-svg-flow" />
      <text x="438" y="104" className="gate-svg-note">DISK GATE</text>
    </>
  ) },
  "Spoke Gate": { caption: "TOP VIEW", art: (
    <>
      <circle cx="470" cy="165" r="96" className="gate-svg-part" />
      <circle cx="470" cy="165" r="26" fill="#fff" stroke="#444a50" strokeWidth="2" />
      <path d="M470 139V82 M470 191v57 M444 165h-57 M496 165h57" className="gate-svg-runner-thin" />
      <circle cx="470" cy="165" r="14" className="gate-svg-gate" />
      <path d="M120 165H445" className="gate-svg-flow" />
      <path d="M120 165H456" className="gate-svg-runner" />
      <text x="426" y="57" className="gate-svg-note">RADIAL SPOKES</text>
    </>
  ) },
  "Hot Tip / Thermal Gate": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M475 52V106" className="gate-svg-hot" />
      <path d="M455 54h40l-13 60h-14z" fill="#f2c18c" stroke="#d97928" strokeWidth="2" />
      <circle cx="475" cy="119" r="7" className="gate-svg-gate" />
      <path d="M475 72v90" className="gate-svg-flow" />
      <text x="505" y="85" className="gate-svg-label">HOT TIP</text>
    </>
  ) },
  "Open Hot-Tip Gate": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M475 52V112" className="gate-svg-hot" />
      <path d="M458 54h34l-11 58h-12z" fill="#f2c18c" stroke="#d97928" strokeWidth="2" />
      <path d="M468 112h14v16h-14z" className="gate-svg-gate" />
      <path d="M475 70v98" className="gate-svg-flow" />
      <text x="500" y="90" className="gate-svg-label">OPEN HOT TIP</text>
    </>
  ) },
  "Valve Gate": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M475 50V115" className="gate-svg-hot" />
      <path d="M457 52h36l-10 62h-16z" fill="#f2c18c" stroke="#d97928" strokeWidth="2" />
      <rect x="470" y="52" width="10" height="74" rx="3" className="gate-svg-valve" />
      <circle cx="475" cy="121" r="8" className="gate-svg-gate" />
      <path d="M495 75v90" className="gate-svg-flow" />
      <text x="505" y="82" className="gate-svg-label">VALVE PIN</text>
      <text x="500" y="125" className="gate-svg-note">CONTROLLED SHUTOFF</text>
    </>
  ) },
  "Multiple Edge Gates": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M90 115H310 M90 165H310 M90 215H310" className="gate-svg-runner" />
      <rect x="310" y="107" width="50" height="16" className="gate-svg-gate" />
      <rect x="310" y="157" width="50" height="16" className="gate-svg-gate" />
      <rect x="310" y="207" width="50" height="16" className="gate-svg-gate" />
      <path d="M120 115H405" className="gate-svg-flow" />
      <path d="M120 165H405" className="gate-svg-flow" />
      <path d="M120 215H405" className="gate-svg-flow" />
      <text x="105" y="91" className="gate-svg-note">BALANCED EDGE FEEDS</text>
    </>
  ) },
  "Multiple Fan Gates": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M90 120H250 M90 210H250" className="gate-svg-runner" />
      <path d="M250 112 L360 95 L360 145 L250 128Z" className="gate-svg-gate" />
      <path d="M250 202 L360 185 L360 235 L250 218Z" className="gate-svg-gate" />
      <path d="M120 120H415" className="gate-svg-flow" />
      <path d="M120 210H415" className="gate-svg-flow" />
      <text x="102" y="94" className="gate-svg-note">MULTIPLE FAN ENTRIES</text>
    </>
  ) },
  "Multiple Film Gates": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M90 125H260 M90 205H260" className="gate-svg-runner" />
      <rect x="260" y="100" width="100" height="50" className="gate-svg-gate" />
      <rect x="260" y="180" width="100" height="50" className="gate-svg-gate" />
      <path d="M120 125H420" className="gate-svg-flow" />
      <path d="M120 205H420" className="gate-svg-flow" />
      <text x="105" y="94" className="gate-svg-note">DISTRIBUTED FILM FEEDS</text>
    </>
  ) },
  "Multiple Pin Gates": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M405 55V112 M475 55V112 M545 55V112" className="gate-svg-runner-thin" />
      <circle cx="405" cy="119" r="7" className="gate-svg-gate" />
      <circle cx="475" cy="119" r="7" className="gate-svg-gate" />
      <circle cx="545" cy="119" r="7" className="gate-svg-gate" />
      <path d="M405 72v86" className="gate-svg-flow" />
      <path d="M475 72v86" className="gate-svg-flow" />
      <path d="M545 72v86" className="gate-svg-flow" />
      <text x="392" y="45" className="gate-svg-note">3-PLATE / PINPOINT ARRAY</text>
    </>
  ) },
  "Multiple Tunnel Gates": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M90 245H250" className="gate-svg-runner" />
      <path d="M250 245L360 190 M250 245L360 145" className="gate-svg-runner-thin" />
      <path d="M120 245L350 193" className="gate-svg-flow" />
      <path d="M120 245L350 148" className="gate-svg-flow" />
      <circle cx="360" cy="190" r="7" className="gate-svg-gate" />
      <circle cx="360" cy="145" r="7" className="gate-svg-gate" />
      <text x="104" y="223" className="gate-svg-note">MULTI-TUNNEL FEED</text>
    </>
  ) },
  "Multiple Hot-Runner Drops": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M405 50V115 M475 50V115 M545 50V115" className="gate-svg-hot" />
      <circle cx="405" cy="120" r="8" className="gate-svg-gate" />
      <circle cx="475" cy="120" r="8" className="gate-svg-gate" />
      <circle cx="545" cy="120" r="8" className="gate-svg-gate" />
      <path d="M405 70v92" className="gate-svg-flow" />
      <path d="M475 70v92" className="gate-svg-flow" />
      <path d="M545 70v92" className="gate-svg-flow" />
      <text x="390" y="40" className="gate-svg-note">HOT-RUNNER DROP ARRAY</text>
    </>
  ) },
  "Sequential Valve Gating": { caption: "SECTION VIEW", art: (
    <>
      <Part />
      <path d="M405 50V115 M475 50V115 M545 50V115" className="gate-svg-hot" />
      <rect x="401" y="50" width="8" height="74" className="gate-svg-valve" />
      <rect x="471" y="50" width="8" height="74" className="gate-svg-valve" />
      <rect x="541" y="50" width="8" height="74" className="gate-svg-valve" />
      <circle cx="405" cy="120" r="8" className="gate-svg-gate" />
      <circle cx="475" cy="120" r="8" className="gate-svg-gate" />
      <circle cx="545" cy="120" r="8" className="gate-svg-gate" />
      <text x="399" y="143" className="gate-svg-step">1</text>
      <text x="469" y="143" className="gate-svg-step">2</text>
      <text x="539" y="143" className="gate-svg-step">3</text>
      <path d="M405 70v90" className="gate-svg-flow" />
      <path d="M475 70v90" className="gate-svg-flow" />
      <path d="M545 70v90" className="gate-svg-flow" />
      <text x="385" y="40" className="gate-svg-note">SEQUENTIAL VALVE OPENING</text>
    </>
  ) },
}

export function GateSchematic({ name }: { name: string }) {
  const { art, caption } = diagrams[name]

  return (
    <svg viewBox="0 0 700 330" role="img" aria-label={name + " schematic"}>
      <defs>
        <marker id="gate-flow-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L7,3 z" fill="#d97928" />
        </marker>
      </defs>
      <rect x="24" y="28" width="652" height="270" rx="16" className="gate-svg-metal" />
      <rect x="45" y="48" width="610" height="230" rx="10" fill="#fff" stroke="#c7ccd0" strokeWidth="1.5" />
      {art}
      <text x="48" y="319" className="gate-svg-note-small">{caption}</text>
    </svg>
  )
}
