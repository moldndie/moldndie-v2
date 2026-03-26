"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { SupplierCategory } from "@/types"
import type { SupplierCategoryFormValues } from "@/schemas/supplier.schema"

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

export async function getSupplierCategories(): Promise<SupplierCategory[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("supplier_categories")
    .select("*")
    .order("name")
  if (error) throw dbError(error)
  return (data ?? []) as SupplierCategory[]
}

export async function createSupplierCategory(
  values: SupplierCategoryFormValues
): Promise<SupplierCategory> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("supplier_categories")
    .insert({ name: values.name })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/suppliers")
  return data as SupplierCategory
}

export async function updateSupplierCategory(
  id: string,
  values: SupplierCategoryFormValues
): Promise<SupplierCategory> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("supplier_categories")
    .update({ name: values.name })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/suppliers")
  return data as SupplierCategory
}

export async function deleteSupplierCategory(id: string): Promise<void> {
  const admin = createAdminClient()

  const { count, error: countError } = await admin
    .from("suppliers")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id)

  if (countError) throw dbError(countError)
  if (count && count > 0) {
    throw new Error(
      `Cannot delete: ${count} supplier${count > 1 ? "s are" : " is"} using this category.`
    )
  }

  const { error } = await admin.from("supplier_categories").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/suppliers")
}
