"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Event } from "@/types"
import type { EventFormValues } from "@/schemas/event.schema"

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

export async function getEvents(): Promise<Event[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false })
  if (error) throw dbError(error)
  return (data ?? []) as Event[]
}

export async function createEvent(values: EventFormValues): Promise<Event> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("events")
    .insert({
      title: values.title,
      description: values.description ?? null,
      image_path: values.image_path,
      event_date: values.event_date ?? null,
      category_id: values.category_id || null,
      country: values.country ?? null,
      address: values.address ?? null,
    })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/events")
  return data as Event
}

export async function updateEvent(id: string, values: EventFormValues): Promise<Event> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("events")
    .update({
      title: values.title,
      description: values.description ?? null,
      image_path: values.image_path,
      event_date: values.event_date ?? null,
      category_id: values.category_id || null,
      country: values.country ?? null,
      address: values.address ?? null,
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/events")
  return data as Event
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("events").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/events")
}
