"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { Ad } from "@/types"
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

async function fetchActiveAds(page: string): Promise<Ad[]> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  // Fetch all active ads for this page, then filter dates in JS to avoid
  // PostgREST OR-chain edge cases with timestamptz parsing.
  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .contains("target_pages", [page])
    .eq("is_active", true)

  if (error) {
    console.error(`[ads] query error for page="${page}":`, error.message)
    throw dbError(error)
  }

  const all = (data ?? []) as Ad[]

  // Apply date-range filter in JS so timezone/format issues can't silently drop ads.
  const filtered = all.filter((ad) => {
    const afterStart = !ad.starts_at || ad.starts_at <= now
    const beforeEnd  = !ad.ends_at   || ad.ends_at   >= now
    return afterStart && beforeEnd
  })

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[ads] page="${page}" found=${all.length} after_date_filter=${filtered.length}`,
      filtered.map((a) => ({ id: a.id, target_pages: a.target_pages, starts_at: a.starts_at, ends_at: a.ends_at }))
    )
  }

  return filtered
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export async function getAdForPlacement(page: string): Promise<Ad | null> {
  const ads = await fetchActiveAds(page)
  if (ads.length === 0) return null
  return ads[Math.floor(Math.random() * ads.length)]
}

export async function getAdsForPlacement(page: string, count: number): Promise<Ad[]> {
  const ads = await fetchActiveAds(page)
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
      target_pages: values.target_pages,
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
      target_pages: values.target_pages,
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
