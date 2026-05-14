"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { MAX_HERO_SLIDES } from "@/lib/heroSlides.constants"

export interface HeroSlide {
  id: string
  image_url: string
  mobile_image: string | null
  title: string | null
  subtitle: string | null
  button_text: string | null
  button_link: string | null
  sort_order: number
  is_active: boolean
  // SEO / accessibility
  alt_text: string | null
  created_at: string
}

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

export async function getActiveHeroSlides(): Promise<HeroSlide[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("hero_slides")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) throw dbError(error)
  return (data ?? []) as HeroSlide[]
}

export async function getAllHeroSlides(): Promise<HeroSlide[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("hero_slides")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) throw dbError(error)
  return (data ?? []) as HeroSlide[]
}

export async function createHeroSlide(
  slide: Omit<HeroSlide, "id" | "created_at">,
): Promise<HeroSlide> {
  const admin = createAdminClient()

  if (slide.is_active) {
    const { count, error: countError } = await admin
      .from("hero_slides")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    if (countError) throw dbError(countError)
    if ((count ?? 0) >= MAX_HERO_SLIDES) {
      throw new Error(`Maximum of ${MAX_HERO_SLIDES} active slides allowed.`)
    }
  }

  const { data, error } = await admin
    .from("hero_slides")
    .insert(slide)
    .select()
    .single()

  if (error) throw dbError(error)
  revalidatePath("/")
  return data as HeroSlide
}

export async function updateHeroSlide(
  id: string,
  updates: Partial<Omit<HeroSlide, "id" | "created_at">>,
): Promise<void> {
  const admin = createAdminClient()

  if (updates.is_active === true) {
    const { count, error: countError } = await admin
      .from("hero_slides")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .neq("id", id)

    if (countError) throw dbError(countError)
    if ((count ?? 0) >= MAX_HERO_SLIDES) {
      throw new Error(`Maximum of ${MAX_HERO_SLIDES} active slides allowed.`)
    }
  }

  const { error } = await admin.from("hero_slides").update(updates).eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/")
}

export async function deleteHeroSlide(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from("hero_slides").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/")
}

export async function updateSlideOrder(id: string, sort_order: number): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from("hero_slides").update({ sort_order }).eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/")
}
