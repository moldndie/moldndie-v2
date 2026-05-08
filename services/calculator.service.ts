"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type {
  Calculator,
  CalculatorWithRelations,
  CalcCategory,
  CalcField,
  CalcOutput,
} from "@/types/calculator"

function dbErr(e: unknown): Error {
  return e && typeof e === "object" && "message" in e
    ? new Error(String((e as { message: unknown }).message))
    : new Error("Database error")
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<CalcCategory[]> {
  const { data, error } = await createAdminClient()
    .from("calculator_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
  if (error) throw dbErr(error)
  return data ?? []
}

export async function getAllCategories(): Promise<CalcCategory[]> {
  const { data, error } = await createAdminClient()
    .from("calculator_categories")
    .select("*")
    .order("sort_order")
  if (error) throw dbErr(error)
  return data ?? []
}

function calcCategorySlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim() || "category"
}

export async function createCalcCategory(payload: {
  name: string
  slug?: string
  description?: string | null
  sort_order?: number
  is_active?: boolean
}): Promise<CalcCategory> {
  const slug = payload.slug || calcCategorySlug(payload.name)
  const { data, error } = await createAdminClient()
    .from("calculator_categories")
    .insert({ name: payload.name, slug, description: payload.description ?? null, sort_order: payload.sort_order ?? 0, is_active: payload.is_active ?? true })
    .select()
    .single()
  if (error) throw dbErr(error)
  revalidatePath("/dashboard/calculators")
  revalidatePath("/tools")
  return data as CalcCategory
}

export async function updateCalcCategory(id: string, payload: {
  name?: string
  slug?: string
  description?: string | null
  sort_order?: number
  is_active?: boolean
}): Promise<void> {
  const updates: Record<string, unknown> = { ...payload, updated_at: new Date().toISOString() }
  if (payload.name && !payload.slug) updates.slug = calcCategorySlug(payload.name)
  const { error } = await createAdminClient()
    .from("calculator_categories")
    .update(updates)
    .eq("id", id)
  if (error) throw dbErr(error)
  revalidatePath("/dashboard/calculators")
  revalidatePath("/tools")
}

export async function deleteCalcCategory(id: string): Promise<void> {
  const { count } = await createAdminClient()
    .from("calculators")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id)
  if (count && count > 0) {
    throw new Error(`Cannot delete: ${count} calculator${count > 1 ? "s use" : " uses"} this category.`)
  }
  const { error } = await createAdminClient()
    .from("calculator_categories")
    .delete()
    .eq("id", id)
  if (error) throw dbErr(error)
  revalidatePath("/dashboard/calculators")
  revalidatePath("/tools")
}

export async function toggleCalcCategoryActive(id: string, active: boolean): Promise<void> {
  const { error } = await createAdminClient()
    .from("calculator_categories")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw dbErr(error)
  revalidatePath("/dashboard/calculators")
  revalidatePath("/tools")
}

// ── Calculators list ──────────────────────────────────────────────────────────

export async function getCalculators(opts?: {
  published?: boolean
  categoryId?: string
  featured?: boolean
}): Promise<(Calculator & { category: CalcCategory | null })[]> {
  let q = createAdminClient()
    .from("calculators")
    .select("*, category:calculator_categories(*)")
    .order("sort_order")
    .order("created_at", { ascending: false })

  if (opts?.published !== undefined) q = q.eq("is_published", opts.published)
  if (opts?.categoryId)             q = q.eq("category_id", opts.categoryId)
  if (opts?.featured)               q = q.eq("is_featured", true)

  const { data, error } = await q
  if (error) throw dbErr(error)
  return (data ?? []) as (Calculator & { category: CalcCategory | null })[]
}

// ── Single calculator ─────────────────────────────────────────────────────────

export async function getCalculatorBySlug(slug: string): Promise<CalculatorWithRelations | null> {
  const { data: calc, error } = await createAdminClient()
    .from("calculators")
    .select("*, category:calculator_categories(*)")
    .eq("slug", slug)
    .single()
  if (error || !calc) return null

  const [{ data: fields }, { data: outputs }] = await Promise.all([
    createAdminClient().from("calculator_fields").select("*").eq("calculator_id", calc.id).order("sort_order"),
    createAdminClient().from("calculator_outputs").select("*").eq("calculator_id", calc.id).order("sort_order"),
  ])

  return {
    ...(calc as Calculator & { category: CalcCategory | null }),
    fields: (fields ?? []) as CalcField[],
    outputs: (outputs ?? []) as CalcOutput[],
  }
}

export async function getCalculatorById(id: string): Promise<CalculatorWithRelations | null> {
  const { data: calc, error } = await createAdminClient()
    .from("calculators")
    .select("*, category:calculator_categories(*)")
    .eq("id", id)
    .single()
  if (error || !calc) return null

  const [{ data: fields }, { data: outputs }] = await Promise.all([
    createAdminClient().from("calculator_fields").select("*").eq("calculator_id", id).order("sort_order"),
    createAdminClient().from("calculator_outputs").select("*").eq("calculator_id", id).order("sort_order"),
  ])

  return {
    ...(calc as Calculator & { category: CalcCategory | null }),
    fields: (fields ?? []) as CalcField[],
    outputs: (outputs ?? []) as CalcOutput[],
  }
}

// ── Create / Update ───────────────────────────────────────────────────────────

type CalcPayload = {
  title: string
  slug: string
  short_description?: string | null
  description?: string | null
  category_id?: string | null
  icon?: string | null
  is_featured?: boolean
  is_published?: boolean
  sort_order?: number
  seo_title?: string | null
  seo_description?: string | null
}

export async function createCalculator(payload: CalcPayload): Promise<Calculator> {
  const { data, error } = await createAdminClient()
    .from("calculators")
    .insert(payload)
    .select()
    .single()
  if (error) throw dbErr(error)
  revalidatePath("/tools")
  return data as Calculator
}

export async function updateCalculator(id: string, payload: Partial<CalcPayload>): Promise<void> {
  const { error } = await createAdminClient()
    .from("calculators")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw dbErr(error)
  revalidatePath("/tools")
  revalidatePath(`/tools/${payload.slug ?? ""}`)
}

export async function deleteCalculator(id: string): Promise<void> {
  const admin = createAdminClient()
  await admin.from("calculator_fields").delete().eq("calculator_id", id)
  await admin.from("calculator_outputs").delete().eq("calculator_id", id)
  await admin.from("calculator_runs").delete().eq("calculator_id", id)
  const { error } = await admin.from("calculators").delete().eq("id", id)
  if (error) throw dbErr(error)
  revalidatePath("/tools")
  revalidatePath("/dashboard/calculators")
}

export async function togglePublished(id: string, published: boolean): Promise<void> {
  const { error } = await createAdminClient()
    .from("calculators")
    .update({ is_published: published, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw dbErr(error)
  revalidatePath("/tools")
  revalidatePath("/dashboard/calculators")
}

export async function duplicateCalculator(id: string): Promise<Calculator> {
  const calc = await getCalculatorById(id)
  if (!calc) throw new Error("Calculator not found")

  const { id: _id, created_at: _ca, updated_at: _ua, views_count: _vc, category, fields, outputs, ...rest } = calc
  const newSlug = `${calc.slug}-copy-${Date.now().toString(36)}`

  const { data: newCalc, error } = await createAdminClient()
    .from("calculators")
    .insert({ ...rest, title: `${calc.title} (Copy)`, slug: newSlug, is_published: false })
    .select()
    .single()
  if (error) throw dbErr(error)

  if (fields.length > 0) {
    const newFields = fields.map(({ id: _fid, calculator_id: _cid, created_at: _fca, ...f }) => ({
      ...f, calculator_id: newCalc.id,
    }))
    await createAdminClient().from("calculator_fields").insert(newFields)
  }
  if (outputs.length > 0) {
    const newOutputs = outputs.map(({ id: _oid, calculator_id: _cid, created_at: _oca, ...o }) => ({
      ...o, calculator_id: newCalc.id,
    }))
    await createAdminClient().from("calculator_outputs").insert(newOutputs)
  }

  revalidatePath("/dashboard/calculators")
  return newCalc as Calculator
}

// ── Fields + Outputs (delete-then-reinsert) ───────────────────────────────────

type FieldInput = Omit<CalcField, "id" | "calculator_id" | "created_at">
type OutputInput = Omit<CalcOutput, "id" | "calculator_id" | "created_at">

export async function saveCalculatorFields(calculatorId: string, fields: FieldInput[]): Promise<void> {
  const admin = createAdminClient()
  await admin.from("calculator_fields").delete().eq("calculator_id", calculatorId)
  if (fields.length === 0) return
  const rows = fields.map((f, i) => ({ ...f, calculator_id: calculatorId, sort_order: i + 1 }))
  const { error } = await admin.from("calculator_fields").insert(rows)
  if (error) throw dbErr(error)
}

export async function saveCalculatorOutputs(calculatorId: string, outputs: OutputInput[]): Promise<void> {
  const admin = createAdminClient()
  await admin.from("calculator_outputs").delete().eq("calculator_id", calculatorId)
  if (outputs.length === 0) return
  const rows = outputs.map((o, i) => ({ ...o, calculator_id: calculatorId, sort_order: i + 1 }))
  const { error } = await admin.from("calculator_outputs").insert(rows)
  if (error) throw dbErr(error)
}

// ── Full calculator save (basic + fields + outputs in one action) ──────────────

export type FullSavePayload = {
  basic: CalcPayload & { id?: string }
  fields: FieldInput[]
  outputs: OutputInput[]
}

export async function saveFullCalculator(payload: FullSavePayload): Promise<Calculator> {
  let calc: Calculator

  if (payload.basic.id) {
    const { id, ...rest } = payload.basic
    await updateCalculator(id, rest)
    calc = (await getCalculatorById(id)) as Calculator
  } else {
    calc = await createCalculator(payload.basic)
  }

  await Promise.all([
    saveCalculatorFields(calc.id, payload.fields),
    saveCalculatorOutputs(calc.id, payload.outputs),
  ])

  revalidatePath("/tools")
  revalidatePath(`/tools/${calc.slug}`)
  revalidatePath("/dashboard/calculators")
  return calc
}

// ── Runs / Analytics ─────────────────────────────────────────────────────────

export async function recordRun(
  calculatorId: string,
  inputs: Record<string, unknown>,
  outputs: Record<string, unknown>,
  userId?: string,
): Promise<void> {
  await createAdminClient().from("calculator_runs").insert({
    calculator_id: calculatorId,
    inputs,
    outputs,
    user_id: userId ?? null,
  })
  // increment views_count
  await createAdminClient().rpc("increment_calculator_views", { calc_id: calculatorId }).then(() => {})
}

export async function getRunStats(): Promise<{
  total: number
  byCalculator: { calculator_id: string; title: string; count: number }[]
  recent: { created_at: string; calculator_id: string }[]
}> {
  const admin = createAdminClient()
  const [{ count }, { data: recent }, { data: calcs }] = await Promise.all([
    admin.from("calculator_runs").select("*", { count: "exact", head: true }),
    admin.from("calculator_runs").select("calculator_id, created_at").order("created_at", { ascending: false }).limit(10),
    admin.from("calculators").select("id, title, views_count").order("views_count", { ascending: false }).limit(10),
  ])

  return {
    total: count ?? 0,
    byCalculator: (calcs ?? []).map((c) => ({ calculator_id: c.id, title: c.title, count: c.views_count ?? 0 })),
    recent: recent ?? [],
  }
}

