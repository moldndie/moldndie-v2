"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export interface PortfolioItem {
  id: string
  title: string
  description: string | null
  images: string[]
  video_path: string | null
  video_url: string | null
  video_paths: string[]
  video_urls: string[]
  /** null = a general example, shown in the portfolio section on /services */
  service_id: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface PortfolioItemFormValues {
  title: string
  description?: string
  images?: string[]
  video_paths?: string[]
  video_urls?: string[]
  service_id?: string
  sort_order: number
  is_active: boolean
}

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

function revalidate() {
  // "layout" so the per-service pages under /services/[slug] refresh too.
  revalidatePath("/services", "layout")
  revalidatePath("/dashboard/portfolio")
}

/** Fall back to the legacy single video columns so existing rows keep showing. */
function normalize(p: PortfolioItem): PortfolioItem {
  return {
    ...p,
    images: p.images ?? [],
    video_paths: p.video_paths?.length ? p.video_paths : p.video_path ? [p.video_path] : [],
    video_urls: p.video_urls?.length ? p.video_urls : p.video_url ? [p.video_url] : [],
  }
}

function toRow(values: PortfolioItemFormValues) {
  const video_paths = values.video_paths ?? []
  const video_urls = (values.video_urls ?? []).filter((u) => u.trim())
  return {
    title:      values.title,
    description: values.description || null,
    images:     values.images ?? [],
    video_path: video_paths[0] ?? null,
    video_url:  video_urls[0] ?? null,
    video_paths,
    video_urls,
    service_id: values.service_id || null,
    sort_order: values.sort_order,
    is_active:  values.is_active,
  }
}

export async function getPortfolioItems(): Promise<PortfolioItem[]> {
  const { data, error } = await createAdminClient()
    .from("portfolio_items")
    .select("*")
    .order("sort_order", { ascending: true })
  if (error) throw dbError(error)
  return ((data ?? []) as PortfolioItem[]).map(normalize)
}

/** General examples — the portfolio section on /services. Items tied to a
 *  specific service are shown on that service's own page instead. */
export async function getActivePortfolioItems(): Promise<PortfolioItem[]> {
  const { data, error } = await createAdminClient()
    .from("portfolio_items")
    .select("*")
    .eq("is_active", true)
    .is("service_id", null)
    .order("sort_order", { ascending: true })
  if (error) throw dbError(error)
  return ((data ?? []) as PortfolioItem[]).map(normalize)
}

export async function getPortfolioItemsForService(serviceId: string): Promise<PortfolioItem[]> {
  const { data, error } = await createAdminClient()
    .from("portfolio_items")
    .select("*")
    .eq("is_active", true)
    .eq("service_id", serviceId)
    .order("sort_order", { ascending: true })
  if (error) throw dbError(error)
  return ((data ?? []) as PortfolioItem[]).map(normalize)
}

export async function createPortfolioItem(values: PortfolioItemFormValues): Promise<PortfolioItem> {
  const { data, error } = await createAdminClient()
    .from("portfolio_items")
    .insert(toRow(values))
    .select()
    .single()
  if (error) throw dbError(error)
  revalidate()
  return normalize(data as PortfolioItem)
}

export async function updatePortfolioItem(
  id: string,
  values: PortfolioItemFormValues,
): Promise<PortfolioItem> {
  const { data, error } = await createAdminClient()
    .from("portfolio_items")
    .update(toRow(values))
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidate()
  return normalize(data as PortfolioItem)
}

export async function deletePortfolioItem(id: string): Promise<void> {
  const { error } = await createAdminClient().from("portfolio_items").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidate()
}

export async function togglePortfolioItemActive(id: string, is_active: boolean): Promise<void> {
  const { error } = await createAdminClient()
    .from("portfolio_items")
    .update({ is_active })
    .eq("id", id)
  if (error) throw dbError(error)
  revalidate()
}

export async function updatePortfolioItemOrder(id: string, sort_order: number): Promise<void> {
  const { error } = await createAdminClient()
    .from("portfolio_items")
    .update({ sort_order })
    .eq("id", id)
  if (error) throw dbError(error)
  revalidate()
}
