export function clampSeconds(v: string | undefined, fallback: number): number {
  const n = Number(v)
  if (!v?.trim() || !Number.isFinite(n)) return fallback
  return Math.min(60, Math.max(2, n))
}

if (process.env.NODE_ENV === "test") {
  console.assert(clampSeconds("", 10) === 10 && clampSeconds("abc", 4) === 4)
  console.assert(clampSeconds("1", 4) === 2 && clampSeconds("99", 4) === 60 && clampSeconds("7", 4) === 7)
}
