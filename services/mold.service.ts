"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { Mold, MoldCategory } from "@/types"
import type { MoldFormValues } from "@/schemas/mold.schema"

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

export interface MoldsParams {
  search?: string
  filter?: "all" | "free" | "paid"
}

export async function getMolds(params?: MoldsParams): Promise<Mold[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from("molds")
    .select("*, category:mold_categories(id,name,slug)")
    .order("created_at", { ascending: false })

  if (params?.search?.trim()) {
    query = query.ilike("title", `%${params.search.trim()}%`)
  }

  if (params?.filter === "free") {
    query = query.eq("price", 0)
  } else if (params?.filter === "paid") {
    query = query.gt("price", 0)
  }

  const { data, error } = await query
  if (error) throw dbError(error)
  return (data ?? []) as Mold[]
}

export async function getMoldById(id: string): Promise<Mold> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("molds")
    .select("*, category:mold_categories(id,name,slug)")
    .eq("id", id)
    .single()
  if (error) throw dbError(error)
  return data as Mold
}

export async function getMoldCategories(): Promise<MoldCategory[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("mold_categories").select("*").order("name")
  if (error) throw dbError(error)
  return (data ?? []) as MoldCategory[]
}

export type SortOption = "newest" | "oldest" | "price_asc" | "price_desc" | "title_asc"

export type DifficultyFilter = "simple" | "moderate" | "difficult" | "sophisticated" | ""

export interface MoldsListingParams {
  search?: string
  categoryId?: string | null
  sort?: SortOption
  difficulty?: DifficultyFilter
  page?: number
  pageSize?: number
}

export interface MoldsListingResult {
  data: Mold[]
  total: number
}

export async function getMoldsListing(params: MoldsListingParams = {}): Promise<MoldsListingResult> {
  const supabase = createAdminClient()
  const { search, categoryId, sort = "newest", difficulty, page = 1, pageSize = 12 } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const sortMap: Record<SortOption, { column: string; ascending: boolean }> = {
    newest:     { column: "created_at", ascending: false },
    oldest:     { column: "created_at", ascending: true },
    price_asc:  { column: "price",      ascending: true },
    price_desc: { column: "price",      ascending: false },
    title_asc:  { column: "title",      ascending: true },
  }
  const { column, ascending } = sortMap[sort]

  let query = supabase
    .from("molds")
    .select("*, category:mold_categories(id,name,slug)", { count: "exact" })
    .order(column, { ascending })
    .range(from, to)

  if (search?.trim()) {
    query = query.ilike("title", `%${search.trim()}%`)
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId)
  }

  if (difficulty) {
    query = query.eq("difficulty", difficulty)
  }

  const { data, error, count } = await query
  if (error) throw dbError(error)
  return { data: (data ?? []) as Mold[], total: count ?? 0 }
}

export async function createMold(values: MoldFormValues): Promise<Mold> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("molds")
    .insert({
      title: values.title,
      description: values.description ?? null,
      category_id: values.category_id || null,
      // is_free is form-only; derive price: free molds store null
      price: values.is_free ? 0 : values.price,
      preview_image: values.preview_image ?? null,
      file_key: values.file_key,
      difficulty: values.difficulty ?? null,
    })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/molds")
  return data as Mold
}

export async function updateMold(id: string, values: MoldFormValues): Promise<Mold> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("molds")
    .update({
      title: values.title,
      description: values.description ?? null,
      category_id: values.category_id || null,
      price: values.is_free ? 0 : values.price,
      preview_image: values.preview_image ?? null,
      file_key: values.file_key,
      difficulty: values.difficulty ?? null,
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/molds")
  return data as Mold
}

export async function deleteMold(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("molds").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/molds")
}
