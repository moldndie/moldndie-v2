"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export interface AcademyCategory {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface AcademyCategoryPayload {
  name: string
  description?: string | null
  sort_order?: number
  is_active?: boolean
}

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const admin = createAdminClient()
  let slug = slugify(base) || "category"
  let suffix = 0
  while (true) {
    let q = admin.from("academy_categories").select("id").eq("slug", slug)
    if (excludeId) q = q.neq("id", excludeId)
    const { data } = await q.maybeSingle()
    if (!data) return slug
    suffix += 1
    slug = `${slugify(base)}-${suffix}`
  }
}

function revalidateAll() {
  revalidatePath("/dashboard/courses")
  revalidatePath("/courses")
  revalidatePath("/courses/category/[slug]", "page")
}

export async function getAcademyCategories(): Promise<AcademyCategory[]> {
  // Try ordering by sort_order (requires migration 20260508_academy_categories_fields).
  // Fall back to name ordering if the column doesn't exist yet.
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("academy_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name",       { ascending: true })

  if (error) {
    if (error.message?.includes("sort_order") || error.message?.includes("description")) {
      const { data: fallback, error: fallbackErr } = await admin
        .from("academy_categories")
        .select("id, name, slug, created_at")
        .order("name", { ascending: true })
      if (fallbackErr) throw dbError(fallbackErr)
      return (fallback ?? []).map((r) => ({
        ...(r as object),
        description: null,
        sort_order: 0,
        is_active: true,
      })) as AcademyCategory[]
    }
    throw dbError(error)
  }
  return (data ?? []) as AcademyCategory[]
}

export async function getActiveAcademyCategories(): Promise<AcademyCategory[]> {
  const all = await getAcademyCategories()
  return all.filter((c) => c.is_active)
}

export async function getAcademyCategoryBySlug(slug: string): Promise<AcademyCategory | null> {
  const { data, error } = await createAdminClient()
    .from("academy_categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()
  if (error) throw dbError(error)
  return data as AcademyCategory | null
}

async function hasExtendedColumns(): Promise<boolean> {
  const { error } = await createAdminClient()
    .from("academy_categories")
    .select("sort_order")
    .limit(1)
  return !error
}

export async function createAcademyCategory(
  payload: AcademyCategoryPayload
): Promise<AcademyCategory> {
  const slug = await uniqueSlug(payload.name)
  const extended = await hasExtendedColumns()
  const row = extended
    ? { name: payload.name.trim(), slug, description: payload.description?.trim() || null, sort_order: payload.sort_order ?? 0, is_active: payload.is_active ?? true }
    : { name: payload.name.trim(), slug }
  const { data, error } = await createAdminClient()
    .from("academy_categories")
    .insert(row)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidateAll()
  return { description: null, sort_order: 0, is_active: true, ...(data as object) } as AcademyCategory
}

export async function updateAcademyCategory(
  id: string,
  payload: AcademyCategoryPayload
): Promise<AcademyCategory> {
  const slug = await uniqueSlug(payload.name, id)
  const extended = await hasExtendedColumns()
  const row = extended
    ? { name: payload.name.trim(), slug, description: payload.description?.trim() || null, sort_order: payload.sort_order ?? 0, is_active: payload.is_active ?? true }
    : { name: payload.name.trim(), slug }
  const { data, error } = await createAdminClient()
    .from("academy_categories")
    .update(row)
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidateAll()
  return { description: null, sort_order: 0, is_active: true, ...(data as object) } as AcademyCategory
}

export async function toggleAcademyCategoryActive(
  id: string,
  active: boolean
): Promise<void> {
  const extended = await hasExtendedColumns()
  if (!extended) throw new Error("Run the migration first to enable active/inactive toggle.")
  const { error } = await createAdminClient()
    .from("academy_categories")
    .update({ is_active: active })
    .eq("id", id)
  if (error) throw dbError(error)
  revalidateAll()
}

export async function deleteAcademyCategory(id: string): Promise<void> {
  const { count, error: countError } = await createAdminClient()
    .from("courses")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id)
  if (countError) throw dbError(countError)
  if (count && count > 0) {
    throw new Error(
      `Cannot delete: ${count} course${count > 1 ? "s are" : " is"} using this category.`
    )
  }
  const { error } = await createAdminClient()
    .from("academy_categories")
    .delete()
    .eq("id", id)
  if (error) throw dbError(error)
  revalidateAll()
}
