"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("name")
  if (error) throw dbError(error)
  return (data ?? []) as Supplier[]
}

export type SupplierSort = "newest" | "oldest" | "name_asc" | "name_desc"

export interface SuppliersListingParams {
  search?: string
  categoryId?: string | null
  sort?: SupplierSort
  page?: number
  pageSize?: number
}

export interface SuppliersListingResult {
  data: Supplier[]
  total: number
}

export async function getSuppliersListing(
  params: SuppliersListingParams = {}
): Promise<SuppliersListingResult> {
  const supabase = createAdminClient()
  const { search, categoryId, sort = "name_asc", page = 1, pageSize = 12 } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const orderMap: Record<SupplierSort, { col: string; asc: boolean }> = {
    newest:   { col: "created_at", asc: false },
    oldest:   { col: "created_at", asc: true  },
    name_asc: { col: "name",       asc: true  },
    name_desc:{ col: "name",       asc: false },
  }
  const { col, asc } = orderMap[sort]

  let query = supabase
    .from("suppliers")
    .select("*, category:supplier_categories(id,name)", { count: "exact" })
    .order(col, { ascending: asc })
    .range(from, to)

  if (search?.trim()) {
    query = query.ilike("name", `%${search.trim()}%`)
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId)
  }

  const { data, error, count } = await query
  if (error) throw dbError(error)
  return { data: (data ?? []) as Supplier[], total: count ?? 0 }
}

export async function getSupplierById(id: string): Promise<Supplier> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("suppliers")
    .select("*, category:supplier_categories(id,name)")
    .eq("id", id)
    .single()
  if (error) throw dbError(error)
  return data as Supplier
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
