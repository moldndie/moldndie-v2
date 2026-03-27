"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { Ad, AdTargetType } from "@/types"
import type { AdFormValues } from "@/schemas/ad.schema"

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

export async function getAds(): Promise<Ad[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw dbError(error)
  return (data ?? []) as Ad[]
}

async function fetchActiveAds(type: AdTargetType): Promise<Ad[]> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const targetTypes = type === "external" ? ["external"] : [type, "external"]
  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .in("target_type", targetTypes)
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
  if (error) throw dbError(error)
  return (data ?? []) as Ad[]
}

// Shuffle an array in-place (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export async function getAdForPlacement(type: AdTargetType): Promise<Ad | null> {
  const ads = await fetchActiveAds(type)
  if (ads.length === 0) return null
  return ads[Math.floor(Math.random() * ads.length)]
}

export async function getAdsForPlacement(type: AdTargetType, count: number): Promise<Ad[]> {
  const ads = await fetchActiveAds(type)
  if (ads.length === 0) return []
  return shuffle(ads).slice(0, count)
}

export async function getAdById(id: string): Promise<Ad> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("ads").select("*").eq("id", id).single()
  if (error) throw dbError(error)
  return data as Ad
}

export async function createAd(values: AdFormValues): Promise<Ad> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("ads")
    .insert({
      title: values.title,
      image_path: values.image_path,
      link: values.link,
      target_type: values.target_type,
      is_active: values.is_active,
      starts_at: values.starts_at || null,
      ends_at: values.ends_at || null,
    })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/ads")
  return data as Ad
}

export async function updateAd(id: string, values: AdFormValues): Promise<Ad> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("ads")
    .update({
      title: values.title,
      image_path: values.image_path,
      link: values.link,
      target_type: values.target_type,
      is_active: values.is_active,
      starts_at: values.starts_at || null,
      ends_at: values.ends_at || null,
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/ads")
  return data as Ad
}

export async function deleteAd(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("ads").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/ads")
}
