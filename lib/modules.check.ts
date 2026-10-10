// Self-check for module toggles.
//   node --experimental-strip-types lib/modules.check.ts

import assert from "node:assert"
import { parseDisabled, enabledModules, isHrefEnabled } from "./modules.ts"

// Blog is locked; unknown keys and whitespace are ignored.
assert.deepStrictEqual(parseDisabled("blog, events ,nope,courses"), ["courses", "events"])
assert.deepStrictEqual(parseDisabled(undefined), [])
assert.deepStrictEqual(parseDisabled(""), [])

const off = ["courses", "tools"]
assert.ok(!enabledModules(off).some((m) => m.key === "courses"))
assert.ok(enabledModules(off).some((m) => m.key === "blog"))

assert.strictEqual(isHrefEnabled("/courses", off), false)
assert.strictEqual(isHrefEnabled("/courses/123?x=1", off), false)
assert.strictEqual(isHrefEnabled("/tools#top", off), false)
assert.strictEqual(isHrefEnabled("/toolsmith", off), true)   // prefix, not a child route
assert.strictEqual(isHrefEnabled("/blogs", off), true)
assert.strictEqual(isHrefEnabled("/molds/1", off), true)
assert.strictEqual(isHrefEnabled("https://example.com/courses", off), true)

console.log("modules.check ok")
