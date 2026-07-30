/**
 * Run: npx tsx lib/richtext.test.ts
 *
 * Guards the one path that can destroy data: descriptions saved as plain text
 * before their field became a rich text editor must survive the round trip.
 */
import assert from "node:assert/strict"
import { toDoc, fromDoc, docToText, isDocEmpty } from "./richtext"

// Legacy plain text is wrapped, not dropped.
const legacy = toDoc("Supplier of hot runner systems.")
assert.equal(legacy?.type, "doc")
assert.equal(docToText(legacy), "Supplier of hot runner systems.")

// Blank paragraphs split on double newlines.
assert.equal(docToText(toDoc("First para.\n\nSecond para.")), "First para. Second para.")

// Real Tiptap JSON parses as-is.
const stored = '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hi"}]}]}'
assert.equal(docToText(stored), "Hi")
assert.deepEqual(toDoc(stored), JSON.parse(stored))

// A plain string that merely starts with "{" is not silently lost.
assert.equal(docToText("{not json after all"), "{not json after all")

// Empty in, empty out — so `value.trim() || null` still stores NULL.
assert.equal(toDoc(""), null)
assert.equal(toDoc(null), null)
assert.equal(fromDoc({ type: "doc", content: [{ type: "paragraph" }] }), "")
assert.equal(isDocEmpty({ type: "doc", content: [{ type: "paragraph" }] }), true)

// Non-empty docs serialize and round-trip.
const doc = toDoc("Round trip")!
assert.equal(docToText(toDoc(fromDoc(doc))), "Round trip")

console.log("richtext: all assertions passed")
