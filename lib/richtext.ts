/**
 * Tiptap JSON <-> text-column helpers.
 *
 * Descriptions live in plain `text` columns and hold `JSON.stringify(doc)`.
 * Records saved before a field became rich text hold raw plain text, so
 * `toDoc` wraps anything unparseable in a paragraph instead of dropping it.
 */

type Doc = Record<string, unknown>

function paragraphDoc(text: string): Doc {
  return {
    type: "doc",
    content: text
      .split(/\n{2,}/)
      .map((block) => ({
        type: "paragraph",
        content: block.trim() ? [{ type: "text", text: block.trim() }] : undefined,
      })),
  }
}

/** string (JSON or plain) | object | null -> Tiptap doc | null */
export function toDoc(raw: unknown): Doc | null {
  if (!raw) return null
  if (typeof raw === "object") return raw as Doc
  if (typeof raw !== "string") return null

  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as Doc
      if (parsed && typeof parsed === "object" && parsed.type === "doc") return parsed
    } catch {
      // fall through — legacy plain text that merely starts with "{"
    }
  }
  return paragraphDoc(trimmed)
}

/**
 * Tiptap doc -> string for a text column.
 * An empty doc serializes to "" so existing `value.trim() || null` save paths
 * keep storing NULL instead of an empty-paragraph JSON blob.
 */
export function fromDoc(doc: Doc): string {
  return isDocEmpty(doc) ? "" : JSON.stringify(doc)
}

/**
 * Flatten a stored description to plain text.
 * For card teasers and line-clamped previews, where rendering HTML is overkill
 * and printing the raw column would leak `{"type":"doc",…}` at the user.
 */
export function docToText(raw: unknown): string {
  const doc = toDoc(raw)
  if (!doc) return ""
  const out: string[] = []
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return
    const n = node as { type?: string; text?: string; content?: unknown[] }
    if (typeof n.text === "string") out.push(n.text)
    n.content?.forEach(walk)
  }
  walk(doc)
  return out.join(" ").replace(/\s+/g, " ").trim()
}

/** True when the doc has no renderable content. */
export function isDocEmpty(doc: Doc): boolean {
  const nodes = doc.content as Array<{ type: string; content?: unknown[] }> | undefined
  if (!nodes || nodes.length === 0) return true
  return nodes.every((n) => n.type === "paragraph" && (!n.content || n.content.length === 0))
}
