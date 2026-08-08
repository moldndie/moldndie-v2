// Pill model for the dashboard's formula editor: expression string ⇄ tokens.
//
// Kept out of the component so it stays pure and testable — see
// formula-tokens.check.ts. Reuses the engine's own lexer so the two can't drift.

import { tokenize, FUNCTION_NAMES, CONSTANT_NAMES } from "./formula-engine.ts"

export type FormulaToken =
  | { kind: "var"; key: string }
  | { kind: "num"; text: string }
  | { kind: "op"; op: "+" | "-" | "*" | "/" | "^" }
  | { kind: "paren"; p: "(" | ")" }
  | { kind: "fn"; name: string }
  | { kind: "const"; name: string }
  | { kind: "comma" }

/**
 * Rebuild pills from a stored expression. Returns null when the formula uses
 * something the pill model can't represent, so the caller can fall back to a
 * raw text box instead of silently mangling it.
 */
export function hydrate(expr: string): FormulaToken[] | null {
  if (!expr.trim()) return []
  let raw
  try {
    raw = tokenize(expr)
  } catch {
    return null
  }

  const out: FormulaToken[] = []
  for (let i = 0; i < raw.length; i++) {
    const t = raw[i]
    switch (t.type) {
      case "EOF": break
      case "NUMBER": out.push({ kind: "num", text: String(t.value) }); break
      case "PLUS": out.push({ kind: "op", op: "+" }); break
      case "MINUS": out.push({ kind: "op", op: "-" }); break
      case "STAR": out.push({ kind: "op", op: "*" }); break
      case "SLASH": out.push({ kind: "op", op: "/" }); break
      case "CARET": out.push({ kind: "op", op: "^" }); break
      case "LPAREN": out.push({ kind: "paren", p: "(" }); break
      case "RPAREN": out.push({ kind: "paren", p: ")" }); break
      case "COMMA": out.push({ kind: "comma" }); break
      case "IDENT": {
        const name = String(t.value)
        const lower = name.toLowerCase()
        // `name(` is a single pill; swallow the paren the lexer emitted next.
        if (raw[i + 1]?.type === "LPAREN" && FUNCTION_NAMES.includes(lower)) {
          out.push({ kind: "fn", name: lower })
          i++
        } else if (CONSTANT_NAMES.includes(lower)) {
          out.push({ kind: "const", name: lower })
        } else {
          out.push({ kind: "var", key: name })
        }
        break
      }
      default: return null
    }
  }
  return out
}

export function serialize(tokens: FormulaToken[]): string {
  let out = ""
  for (const t of tokens) {
    const piece =
      t.kind === "var" ? t.key
      : t.kind === "num" ? (t.text || "0")
      : t.kind === "op" ? t.op
      : t.kind === "paren" ? t.p
      : t.kind === "fn" ? `${t.name}(`
      : t.kind === "const" ? t.name
      : ","

    // No space after an opening paren, or before a closing paren / comma.
    const noSpace = out === "" || out.endsWith("(") || piece === ")" || piece === ","
    out += noSpace ? piece : ` ${piece}`
  }
  return out
}
