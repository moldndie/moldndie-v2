"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { MoldGalleryItem } from "@/types"

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

export async function getGalleryItems(moldId: string): Promise<MoldGalleryItem[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("mold_gallery")
    .select("*")
    .eq("mold_id", moldId)
    .order("position")
  if (error) throw dbError(error)
  return (data ?? []) as MoldGalleryItem[]
}

export async function addGalleryItems(
  moldId: string,
  items: { file_key: string; type: string; position: number }[]
): Promise<void> {
  if (items.length === 0) return
  const admin = createAdminClient()
  const { error } = await admin.from("mold_gallery").insert(
    items.map((item) => ({
      mold_id: moldId,
      file_key: item.file_key,
      type: item.type,
      position: item.position,
    }))
  )
  if (error) throw dbError(error)
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from("mold_gallery").delete().eq("id", id)
  if (error) throw dbError(error)
}
