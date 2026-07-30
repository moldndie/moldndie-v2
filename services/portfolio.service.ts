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
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface PortfolioItemFormValues {
  title: string
  description?: string
  images?: string[]
  video_path?: string
  video_url?: string
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
  revalidatePath("/services")
  revalidatePath("/dashboard/portfolio")
}

function toRow(values: PortfolioItemFormValues) {
  return {
    title:      values.title,
    description: values.description || null,
    images:     values.images ?? [],
    video_path: values.video_path || null,
    video_url:  values.video_url || null,
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
  return (data ?? []) as PortfolioItem[]
}

export async function getActivePortfolioItems(): Promise<PortfolioItem[]> {
  const { data, error } = await createAdminClient()
    .from("portfolio_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
  if (error) throw dbError(error)
  return (data ?? []) as PortfolioItem[]
}

export async function createPortfolioItem(values: PortfolioItemFormValues): Promise<PortfolioItem> {
  const { data, error } = await createAdminClient()
    .from("portfolio_items")
    .insert(toRow(values))
    .select()
    .single()
  if (error) throw dbError(error)
  revalidate()
  return data as PortfolioItem
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
  return data as PortfolioItem
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
