// Self-check for the formula pill model.
//   node --experimental-strip-types lib/formula-tokens.check.ts
//
// The thing that must never break: a formula saved before the pill editor
// existed has to survive being loaded and re-saved unchanged.

import assert from "node:assert"
import { hydrate, serialize } from "./formula-tokens.ts"
import { evaluateFormula } from "./formula-engine.ts"

function roundTrip(expr: string) {
  const toks = hydrate(expr)
  assert.ok(toks !== null, `should hydrate: ${expr}`)
  return serialize(toks!)
}

// Round-trips exactly — these are the shapes the seeded calculators use.
for (const expr of [
  "wall * 2.5",
  "t0 + ti + th + tc",
  "pi * radius ^ 2",
  "sqrt(alpha) / wall",
  "pow(wall, 2) * pi",
  "min(a, b) + max(c, d)",
  "(a + b) * c",
  "clamp_force * 0.9 / 1000",
]) {
  assert.strictEqual(roundTrip(expr), expr, `round-trip changed: ${expr}`)
}

// Whitespace is normalised, but the meaning is not.
assert.strictEqual(roundTrip("a  +   b"), "a + b")
assert.strictEqual(roundTrip("( a+b )*c"), "(a + b) * c")

// Normalising must never change the computed value.
const vars = { a: 3, b: 4, c: 2, wall: 2.5, radius: 2 }
for (const expr of ["a  +   b", "( a+b )*c", "pi * radius ^ 2", "sqrt(a) / wall"]) {
  const before = evaluateFormula(expr, vars)
  const after = evaluateFormula(roundTrip(expr), vars)
  assert.deepStrictEqual(after, before, `value changed for: ${expr}`)
}

// A function call is one pill, not an identifier plus a paren.
const fn = hydrate("sqrt(a)")!
assert.deepStrictEqual(fn[0], { kind: "fn", name: "sqrt" })
assert.strictEqual(fn.length, 3) // fn, var, )

// Constants are not variables — they must not show up in the input menu.
assert.deepStrictEqual(hydrate("pi")![0], { kind: "const", name: "pi" })

// Unlexable input falls back rather than being mangled.
assert.strictEqual(hydrate("a $ b"), null)

assert.deepStrictEqual(hydrate(""), [])
assert.strictEqual(serialize([]), "")

console.log("formula-tokens: all checks passed")
