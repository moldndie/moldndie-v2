"use server"

import { createClient } from "@/lib/supabase/server"
import type { Purchase } from "@/types"

export async function getPurchases(): Promise<Purchase[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("purchases")
    .select("*, user:profiles(id,first_name,last_name)")
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as Purchase[]
}

export async function getPurchasesByUser(userId: string): Promise<Purchase[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("purchases")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as Purchase[]
}
