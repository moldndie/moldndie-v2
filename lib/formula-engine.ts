// Safe formula evaluator — no eval(), no Function().
// Supports: + - * / ^ () pi e pow sqrt abs min max floor ceil round log log10

type TokenType =
  | "NUMBER" | "IDENT" | "PLUS" | "MINUS" | "STAR" | "SLASH"
  | "CARET" | "LPAREN" | "RPAREN" | "COMMA" | "EOF"

interface Token { type: TokenType; value?: string | number }

const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E }

const FUNCTIONS: Record<string, (...a: number[]) => number> = {
  pow:   (x, y)    => Math.pow(x, y),
  sqrt:  (x)       => Math.sqrt(x),
  abs:   (x)       => Math.abs(x),
  min:   (...a)    => Math.min(...a),
  max:   (...a)    => Math.max(...a),
  floor: (x)       => Math.floor(x),
  ceil:  (x)       => Math.ceil(x),
  round: (x)       => Math.round(x),
  log:   (x)       => Math.log(x),
  log10: (x)       => Math.log10(x),
  sin:   (x)       => Math.sin(x),
  cos:   (x)       => Math.cos(x),
  tan:   (x)       => Math.tan(x),
}

function tokenize(expr: string): Token[] {
  const toks: Token[] = []
  let i = 0
  while (i < expr.length) {
    const c = expr[i]
    if (/\s/.test(c)) { i++; continue }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(expr[i + 1] ?? ""))) {
      let s = ""
      while (i < expr.length && /[0-9.]/.test(expr[i])) s += expr[i++]
      toks.push({ type: "NUMBER", value: parseFloat(s) })
    } else if (/[a-zA-Z_]/.test(c)) {
      let s = ""
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) s += expr[i++]
      toks.push({ type: "IDENT", value: s })
    } else {
      const MAP: Record<string, TokenType> = {
        "+": "PLUS", "-": "MINUS", "*": "STAR", "/": "SLASH",
        "^": "CARET", "(": "LPAREN", ")": "RPAREN", ",": "COMMA",
      }
      if (MAP[c]) { toks.push({ type: MAP[c] }); i++ }
      else throw new Error(`Unexpected character '${c}'`)
    }
  }
  toks.push({ type: "EOF" })
  return toks
}

class Parser {
  private pos = 0
  constructor(
    private readonly toks: Token[],
    private readonly vars: Record<string, number>,
  ) {}

  private peek() { return this.toks[this.pos] }
  private eat()  { return this.toks[this.pos++] }
  private expect(t: TokenType) {
    const tok = this.eat()
    if (tok.type !== t) throw new Error(`Expected ${t}, got ${tok.type}`)
    return tok
  }

  parse(): number {
    const v = this.expr()
    if (this.peek().type !== "EOF") throw new Error("Unexpected token after expression")
    return v
  }

  // expr = term ((+|-) term)*
  private expr(): number {
    let v = this.term()
    while (this.peek().type === "PLUS" || this.peek().type === "MINUS") {
      const op = this.eat().type
      const r = this.term()
      v = op === "PLUS" ? v + r : v - r
    }
    return v
  }

  // term = unary ((*|/) unary)*
  private term(): number {
    let v = this.unary()
    while (this.peek().type === "STAR" || this.peek().type === "SLASH") {
      const op = this.eat().type
      const r = this.unary()
      if (op === "SLASH" && r === 0) throw new Error("Division by zero")
      v = op === "STAR" ? v * r : v / r
    }
    return v
  }

  // unary = -? power
  private unary(): number {
    if (this.peek().type === "MINUS") { this.eat(); return -this.power() }
    return this.power()
  }

  // power = primary (^ unary)?  (right-associative)
  private power(): number {
    const base = this.primary()
    if (this.peek().type === "CARET") {
      this.eat()
      return Math.pow(base, this.unary())
    }
    return base
  }

  // primary = NUMBER | (expr) | IDENT (args)?
  private primary(): number {
    const t = this.peek()
    if (t.type === "NUMBER") { this.eat(); return t.value as number }
    if (t.type === "LPAREN") {
      this.eat()
      const v = this.expr()
      this.expect("RPAREN")
      return v
    }
    if (t.type === "IDENT") {
      this.eat()
      const name = t.value as string
      const lower = name.toLowerCase()
      if (this.peek().type === "LPAREN") {
        this.eat()
        const args: number[] = []
        if (this.peek().type !== "RPAREN") {
          args.push(this.expr())
          while (this.peek().type === "COMMA") { this.eat(); args.push(this.expr()) }
        }
        this.expect("RPAREN")
        const fn = FUNCTIONS[lower]
        if (!fn) throw new Error(`Unknown function '${name}'`)
        return fn(...args)
      }
      if (lower in CONSTANTS) return CONSTANTS[lower]
      if (name in this.vars) {
        const v = this.vars[name]
        if (!isFinite(v)) throw new Error(`Variable '${name}' is not a finite number`)
        return v
      }
      throw new Error(`Unknown variable '${name}'`)
    }
    throw new Error(`Unexpected token '${t.type}'`)
  }
}

export interface FormulaResult {
  value: number
  error?: never
}
export interface FormulaError {
  value?: never
  error: string
}

export function evaluateFormula(
  formula: string,
  variables: Record<string, number>,
): FormulaResult | FormulaError {
  try {
    const toks = tokenize(formula.trim())
    const result = new Parser(toks, variables).parse()
    if (!isFinite(result)) return { error: "Result is not a finite number" }
    return { value: result }
  } catch (e) {
    return { error: (e as Error).message }
  }
}
