"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Supplier } from "@/types"
import type { SupplierFormValues } from "@/schemas/supplier.schema"

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

export async function getSuppliers(): Promise<Supplier[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("name")
  if (error) throw dbError(error)
  return (data ?? []) as Supplier[]
}

export async function createSupplier(values: SupplierFormValues): Promise<Supplier> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      name: values.name,
      description: values.description ?? null,
      logo_path: values.logo_path ?? null,
      website: values.website ?? null,
      category_id: values.category_id || null,
      country: values.country ?? null,
      address: values.address ?? null,
    })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/suppliers")
  return data as Supplier
}

export async function updateSupplier(id: string, values: SupplierFormValues): Promise<Supplier> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("suppliers")
    .update({
      name: values.name,
      description: values.description ?? null,
      logo_path: values.logo_path ?? null,
      website: values.website ?? null,
      category_id: values.category_id || null,
      country: values.country ?? null,
      address: values.address ?? null,
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/suppliers")
  return data as Supplier
}

export async function deleteSupplier(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("suppliers").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/suppliers")
}
