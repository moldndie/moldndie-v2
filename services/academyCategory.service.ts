"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export interface AcademyCategory {
  id: string
  name: string
  slug: string
  created_at: string
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

export async function getAcademyCategories(): Promise<AcademyCategory[]> {
  const { data, error } = await createAdminClient()
    .from("academy_categories")
    .select("*")
    .order("name")
  if (error) throw dbError(error)
  return (data ?? []) as AcademyCategory[]
}

export async function createAcademyCategory(name: string): Promise<AcademyCategory> {
  const slug = await uniqueSlug(name)
  const { data, error } = await createAdminClient()
    .from("academy_categories")
    .insert({ name, slug })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/courses")
  return data as AcademyCategory
}

export async function updateAcademyCategory(id: string, name: string): Promise<AcademyCategory> {
  const slug = await uniqueSlug(name, id)
  const { data, error } = await createAdminClient()
    .from("academy_categories")
    .update({ name, slug })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/courses")
  return data as AcademyCategory
}

export async function deleteAcademyCategory(id: string): Promise<void> {
  const { count, error: countError } = await createAdminClient()
    .from("courses")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id)
  if (countError) throw dbError(countError)
  if (count && count > 0) {
    throw new Error(`Cannot delete: ${count} course${count > 1 ? "s are" : " is"} using this category.`)
  }
  const { error } = await createAdminClient().from("academy_categories").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/courses")
}
