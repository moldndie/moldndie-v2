"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export interface ServiceOffering {
  id: string
  title: string
  slug: string
  tagline: string | null
  description: string | null
  highlights?: string[] | null
  image: string | null
  images: string[]
  videos: string[]
  video_urls: string[]
  icon: string | null
  is_active: boolean
  is_egypt_only: boolean
  sort_order: number
  created_at: string
}

export interface ServiceOfferingFormValues {
  title: string
  slug: string
  tagline?: string
  description?: string
  highlights?: string[]
  image?: string
  images?: string[]
  videos?: string[]
  video_urls?: string[]
  icon?: string
  is_active: boolean
  is_egypt_only: boolean
  sort_order: number
}

/** Fall back to the legacy single image so existing rows keep showing. */
function normalize(s: ServiceOffering): ServiceOffering {
  return {
    ...s,
    images: s.images?.length ? s.images : s.image ? [s.image] : [],
    videos: s.videos ?? [],
    video_urls: s.video_urls ?? [],
  }
}

function toRow(values: ServiceOfferingFormValues) {
  const images = values.images ?? []
  return {
    title:         values.title,
    slug:          values.slug,
    tagline:       values.tagline ?? null,
    description:   values.description ?? null,
    highlights:    values.highlights ?? [],
    image:         images[0] ?? "",
    images,
    videos:        values.videos ?? [],
    video_urls:    (values.video_urls ?? []).filter((u) => u.trim()),
    icon:          values.icon ?? null,
    is_active:     values.is_active,
    is_egypt_only: values.is_egypt_only,
    sort_order:    values.sort_order,
  }
}

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

export async function getServices(): Promise<ServiceOffering[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true })
  if (error) throw dbError(error)
  return ((data ?? []) as ServiceOffering[]).map(normalize)
}

export async function getActiveServices(): Promise<ServiceOffering[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
  if (error) throw dbError(error)
  return ((data ?? []) as ServiceOffering[]).map(normalize)
}

/** Active service for the public /services/[slug] page. null when missing. */
export async function getActiveServiceBySlug(slug: string): Promise<ServiceOffering | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()
  if (error) throw dbError(error)
  return data ? normalize(data as ServiceOffering) : null
}

export async function getServiceById(id: string): Promise<ServiceOffering> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw dbError(error)
  return normalize(data as ServiceOffering)
}

export async function createService(values: ServiceOfferingFormValues): Promise<ServiceOffering> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("services")
    .insert(toRow(values))
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/services")
  revalidatePath("/dashboard/services")
  return normalize(data as ServiceOffering)
}

export async function updateService(id: string, values: ServiceOfferingFormValues): Promise<ServiceOffering> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("services")
    .update(toRow(values))
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/services")
  revalidatePath("/dashboard/services")
  return normalize(data as ServiceOffering)
}

export async function toggleServiceActive(id: string, is_active: boolean): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("services")
    .update({ is_active })
    .eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/services")
  revalidatePath("/dashboard/services")
}

export async function updateServiceOrder(id: string, sort_order: number): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("services")
    .update({ sort_order })
    .eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/services")
  revalidatePath("/dashboard/services")
}

export async function deleteService(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("services").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/services")
  revalidatePath("/dashboard/services")
}
