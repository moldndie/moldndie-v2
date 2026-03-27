"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { MoldCategory } from "@/types"
import type { MoldCategoryFormValues } from "@/schemas/moldCategory.schema"

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

export async function getMoldCategories(): Promise<MoldCategory[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("mold_categories")
    .select("*")
    .order("name")
  if (error) throw dbError(error)
  return (data ?? []) as MoldCategory[]
}

export async function createMoldCategory(values: MoldCategoryFormValues): Promise<MoldCategory> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("mold_categories")
    .insert({ name: values.name, slug: values.slug })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/molds")
  return data as MoldCategory
}

export async function updateMoldCategory(
  id: string,
  values: MoldCategoryFormValues
): Promise<MoldCategory> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("mold_categories")
    .update({ name: values.name, slug: values.slug })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/molds")
  return data as MoldCategory
}

export async function deleteMoldCategory(id: string): Promise<void> {
  const admin = createAdminClient()

  const { count, error: countError } = await admin
    .from("molds")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id)

  if (countError) throw dbError(countError)
  if (count && count > 0) {
    throw new Error(
      `Cannot delete: ${count} mold${count > 1 ? "s are" : " is"} using this category.`
    )
  }

  const { error } = await admin.from("mold_categories").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/molds")
}
