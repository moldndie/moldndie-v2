"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { EventCategory } from "@/types"
import type { EventCategoryFormValues } from "@/schemas/event.schema"

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const admin = createAdminClient()
  let slug = slugify(base) || "category"
  let suffix = 0
  while (true) {
    let q = admin.from("event_categories").select("id").eq("slug", slug)
    if (excludeId) q = q.neq("id", excludeId)
    const { data } = await q.maybeSingle()
    if (!data) return slug
    suffix += 1
    slug = `${slugify(base)}-${suffix}`
  }
}

export async function getEventCategories(): Promise<EventCategory[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("event_categories")
    .select("*")
    .order("name")
  if (error) throw dbError(error)
  return (data ?? []) as EventCategory[]
}

export async function createEventCategory(
  values: EventCategoryFormValues
): Promise<EventCategory> {
  const admin = createAdminClient()
  const slug = await uniqueSlug(values.name)
  const { data, error } = await admin
    .from("event_categories")
    .insert({ name: values.name, slug })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/events")
  return data as EventCategory
}

export async function updateEventCategory(
  id: string,
  values: EventCategoryFormValues
): Promise<EventCategory> {
  const admin = createAdminClient()
  const slug = await uniqueSlug(values.name, id)
  const { data, error } = await admin
    .from("event_categories")
    .update({ name: values.name, slug })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/events")
  return data as EventCategory
}

export async function deleteEventCategory(id: string): Promise<void> {
  const admin = createAdminClient()

  const { count, error: countError } = await admin
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id)

  if (countError) throw dbError(countError)
  if (count && count > 0) {
    throw new Error(
      `Cannot delete: ${count} event${count > 1 ? "s are" : " is"} using this category.`
    )
  }

  const { error } = await admin.from("event_categories").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/events")
}
