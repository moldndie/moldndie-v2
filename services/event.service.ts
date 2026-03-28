"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false })
  if (error) throw dbError(error)
  return (data ?? []) as Event[]
}

export type EventSort = "newest" | "oldest" | "date_asc" | "title_asc"

export interface EventsListingParams {
  search?: string
  categoryId?: string | null
  sort?: EventSort
  page?: number
  pageSize?: number
}

export interface EventsListingResult {
  data: Event[]
  total: number
}

export async function getEventsListing(
  params: EventsListingParams = {}
): Promise<EventsListingResult> {
  const supabase = createAdminClient()
  const { search, categoryId, sort = "newest", page = 1, pageSize = 12 } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const orderMap: Record<EventSort, { col: string; asc: boolean }> = {
    newest:    { col: "created_at", asc: false },
    oldest:    { col: "created_at", asc: true  },
    date_asc:  { col: "event_date", asc: true  },
    title_asc: { col: "title",      asc: true  },
  }
  const { col, asc } = orderMap[sort]

  let query = supabase
    .from("events")
    .select("*, category:event_categories(id,name)", { count: "exact" })
    .order(col, { ascending: asc })
    .range(from, to)

  if (search?.trim()) {
    query = query.ilike("title", `%${search.trim()}%`)
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId)
  }

  const { data, error, count } = await query
  if (error) throw dbError(error)
  return { data: (data ?? []) as Event[], total: count ?? 0 }
}

export async function getEventById(id: string): Promise<Event> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("events")
    .select("*, category:event_categories(id,name)")
    .eq("id", id)
    .single()
  if (error) throw dbError(error)
  return data as Event
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
