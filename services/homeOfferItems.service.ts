"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export interface HomeOfferItem {
  id: string
  title: string
  description: string | null
  icon: string
  button_text: string
  button_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HomeOfferItemInput {
  title: string
  description?: string | null
  icon: string
  button_text?: string
  button_url?: string | null
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
  revalidatePath("/dashboard/homepage/offer-items")
}

export async function getActiveOfferItems(): Promise<HomeOfferItem[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("home_offer_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
  if (error) throw dbError(error)
  return (data ?? []) as HomeOfferItem[]
}

export async function getAllOfferItems(): Promise<HomeOfferItem[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("home_offer_items")
    .select("*")
    .order("sort_order", { ascending: true })
  if (error) throw dbError(error)
  return (data ?? []) as HomeOfferItem[]
}

export async function getOfferItemById(id: string): Promise<HomeOfferItem | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("home_offer_items")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw dbError(error)
  return data as HomeOfferItem | null
}

export async function createOfferItem(input: HomeOfferItemInput): Promise<HomeOfferItem> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("home_offer_items")
    .insert({
      title: input.title,
      description: input.description ?? null,
      icon: input.icon,
      button_text: input.button_text ?? "Explore",
      button_url: input.button_url ?? null,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
    })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidate()
  return data as HomeOfferItem
}

export async function updateOfferItem(id: string, input: HomeOfferItemInput): Promise<HomeOfferItem> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("home_offer_items")
    .update({
      title: input.title,
      description: input.description ?? null,
      icon: input.icon,
      button_text: input.button_text ?? "Explore",
      button_url: input.button_url ?? null,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidate()
  return data as HomeOfferItem
}

export async function deleteOfferItem(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("home_offer_items").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidate()
}

export async function setOfferItemActive(id: string, is_active: boolean): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("home_offer_items")
    .update({ is_active })
    .eq("id", id)
  if (error) throw dbError(error)
  revalidate()
}
