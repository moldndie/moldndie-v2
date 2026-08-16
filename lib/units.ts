// Unit conversion for calculators with a Metric/Imperial switcher.
//
// Formulas are authored in one base system. What is stored per input and per
// result describes how to get from that base to what the visitor sees:
//
//   display = base × factor + offset
//
// `offset` is only ever non-zero for temperature, but without it °C ↔ °F is
// silently wrong — 100 °C would show as 180 °F instead of 212 °F.

import type { UnitMap } from "@/types/calculator"

export interface Conversion {
  unit: string
  factor: number
  offset: number
}

/**
 * The conversion for the selected system. Anything unset falls back to the
 * plain `unit` string with factor 1 and offset 0, which is every calculator
 * that predates the unit switcher.
 */
export function unitFor(
  units: UnitMap | null | undefined,
  system: string | null,
  fallback: string | null,
): Conversion {
  const entry = system && units ? units[system] : undefined
  const factor = entry && Number.isFinite(entry.factor) && entry.factor !== 0 ? entry.factor : 1
  const offset = entry && Number.isFinite(entry.offset ?? 0) ? entry.offset ?? 0 : 0
  return { unit: entry?.unit ?? fallback ?? "", factor, offset }
}

/** What the visitor typed → the base system the formula is written in. */
export function toBase(raw: number, u: Conversion): number {
  return (raw - u.offset) / u.factor
}

/** A base-system result → what the visitor should see. */
export function fromBase(base: number, u: Conversion): number {
  return base * u.factor + u.offset
}
