"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export interface HomeWhyCard {
  id: string
  title: string
  description: string | null
  icon: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HomeWhyCardInput {
  title: string
  description?: string | null
  icon: string
  sort_order?: number
  is_active?: boolean
}

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

function revalidate() {
  revalidatePath("/")
  revalidatePath("/dashboard/homepage/why-cards")
}

export async function getActiveWhyCards(): Promise<HomeWhyCard[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("home_why_cards")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
  if (error) throw dbError(error)
  return (data ?? []) as HomeWhyCard[]
}

export async function getAllWhyCards(): Promise<HomeWhyCard[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("home_why_cards")
    .select("*")
    .order("sort_order", { ascending: true })
  if (error) throw dbError(error)
  return (data ?? []) as HomeWhyCard[]
}

export async function getWhyCardById(id: string): Promise<HomeWhyCard | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("home_why_cards")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw dbError(error)
  return data as HomeWhyCard | null
}

export async function createWhyCard(input: HomeWhyCardInput): Promise<HomeWhyCard> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("home_why_cards")
    .insert({
      title: input.title,
      description: input.description ?? null,
      icon: input.icon,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
    })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidate()
  return data as HomeWhyCard
}

export async function updateWhyCard(id: string, input: HomeWhyCardInput): Promise<HomeWhyCard> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("home_why_cards")
    .update({
      title: input.title,
      description: input.description ?? null,
      icon: input.icon,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidate()
  return data as HomeWhyCard
}

export async function deleteWhyCard(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("home_why_cards").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidate()
}

export async function setWhyCardActive(id: string, is_active: boolean): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("home_why_cards")
    .update({ is_active })
    .eq("id", id)
  if (error) throw dbError(error)
  revalidate()
}
