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
  is_active: boolean
  is_egypt_only: boolean
  sort_order: number
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
  return (data ?? []) as ServiceOffering[]
}

export async function getActiveServices(): Promise<ServiceOffering[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
  if (error) throw dbError(error)
  return (data ?? []) as ServiceOffering[]
}

export async function getServiceById(id: string): Promise<ServiceOffering> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw dbError(error)
  return data as ServiceOffering
}

export async function createService(values: ServiceOfferingFormValues): Promise<ServiceOffering> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("services")
    .insert({
      title:         values.title,
      slug:          values.slug,
      tagline:       values.tagline ?? null,
      description:   values.description ?? null,
      highlights:    values.highlights ?? [],
      image:         values.image ?? null,
      is_active:     values.is_active,
      is_egypt_only: values.is_egypt_only,
      sort_order:    values.sort_order,
    })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/services")
  revalidatePath("/dashboard/services")
  return data as ServiceOffering
}

export async function updateService(id: string, values: ServiceOfferingFormValues): Promise<ServiceOffering> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("services")
    .update({
      title:         values.title,
      slug:          values.slug,
      tagline:       values.tagline ?? null,
      description:   values.description ?? null,
      highlights:    values.highlights ?? [],
      image:         values.image ?? null,
      is_active:     values.is_active,
      is_egypt_only: values.is_egypt_only,
      sort_order:    values.sort_order,
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/services")
  revalidatePath("/dashboard/services")
  return data as ServiceOffering
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
