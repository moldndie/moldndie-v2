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
  const { data, error } = await admin
    .from("event_categories")
    .insert({ name: values.name })
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
  const { data, error } = await admin
    .from("event_categories")
    .update({ name: values.name })
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
