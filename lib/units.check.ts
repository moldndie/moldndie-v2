// Self-check for calculator unit conversion.
//   node --experimental-strip-types lib/units.check.ts
//
// The one that matters: temperature. A factor-only conversion turns 100 °C into
// 180 °F and nobody notices until a customer does.

import assert from "node:assert"
import { unitFor, toBase, fromBase } from "./units.ts"

const CELSIUS = { metric: { unit: "°C", factor: 1, offset: 0 }, imperial: { unit: "°F", factor: 1.8, offset: 32 } }
const LENGTH = { metric: { unit: "mm", factor: 1 }, imperial: { unit: "in", factor: 1 / 25.4 } }

// ── Temperature: the offset case ──────────────────────────────────────────────
const f = unitFor(CELSIUS, "imperial", null)
assert.strictEqual(f.unit, "°F")
assert.strictEqual(fromBase(100, f), 212, "100 °C must read as 212 °F")
assert.strictEqual(fromBase(0, f), 32)
assert.strictEqual(toBase(212, f), 100, "212 °F typed in must reach the formula as 100 °C")

// Base system passes through untouched.
const c = unitFor(CELSIUS, "metric", null)
assert.strictEqual(fromBase(100, c), 100)
assert.strictEqual(toBase(100, c), 100)

// ── Length: factor only ───────────────────────────────────────────────────────
const inch = unitFor(LENGTH, "imperial", null)
assert.ok(Math.abs(fromBase(25.4, inch) - 1) < 1e-9, "25.4 mm is 1 inch")
assert.ok(Math.abs(toBase(1, inch) - 25.4) < 1e-9)

// ── Round trip ────────────────────────────────────────────────────────────────
for (const conv of [f, c, inch]) {
  for (const v of [0, 1, 37.5, -20, 1234.5]) {
    assert.ok(Math.abs(toBase(fromBase(v, conv), conv) - v) < 1e-9, "round trip must be lossless")
  }
}

// ── Calculators with no unit switcher are untouched ───────────────────────────
const plain = unitFor(null, null, "mm")
assert.deepStrictEqual(plain, { unit: "mm", factor: 1, offset: 0 })
assert.strictEqual(fromBase(7, plain), 7)
assert.strictEqual(toBase(7, plain), 7)

// A missing entry for the selected system behaves the same way.
assert.deepStrictEqual(unitFor(LENGTH, "nonexistent", "mm"), { unit: "mm", factor: 1, offset: 0 })

// A zero factor would divide by zero — treated as "unset" rather than trusted.
assert.strictEqual(unitFor({ m: { unit: "x", factor: 0 } }, "m", null).factor, 1)

console.log("units: all checks passed")
