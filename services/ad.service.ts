"use server"

import { createClient } from "@/lib/supabase/server"
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
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw dbError(error)
  return (data ?? []) as Ad[]
}

export async function createAd(values: AdFormValues): Promise<Ad> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ads")
    .insert({
      title: values.title,
      image_path: values.image_path,
      target_type: values.target_type,
      link: values.link,
      is_active: values.is_active,
      start_date: values.start_date ?? null,
      end_date: values.end_date ?? null,
    })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/ads")
  return data as Ad
}

export async function updateAd(id: string, values: AdFormValues): Promise<Ad> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ads")
    .update({
      title: values.title,
      image_path: values.image_path,
      target_type: values.target_type,
      link: values.link,
      is_active: values.is_active,
      start_date: values.start_date ?? null,
      end_date: values.end_date ?? null,
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/ads")
  return data as Ad
}

export async function deleteAd(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("ads").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/ads")
}
