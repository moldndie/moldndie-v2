"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { Course } from "@/types"
import type { CourseFormValues } from "@/schemas/course.schema"

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

export type CoursePriceFilter = "all" | "free" | "paid"

export interface CoursesListingParams {
  search?: string
  priceFilter?: CoursePriceFilter
  page?: number
  pageSize?: number
}

export interface CoursesListingResult {
  data: Course[]
  total: number
}

export async function getCoursesListing(
  params: CoursesListingParams = {}
): Promise<CoursesListingResult> {
  const supabase = await createClient()
  const { search, priceFilter = "all", page = 1, pageSize = 12 } = params
  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1

  let query = supabase
    .from("courses")
    .select("id, title, description, price, thumbnail_url, created_at", { count: "exact" })
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (search?.trim()) {
    query = query.ilike("title", `%${search.trim()}%`)
  }

  if (priceFilter === "free") {
    query = query.eq("price", 0)
  } else if (priceFilter === "paid") {
    query = query.gt("price", 0)
  }

  const { data, error, count } = await query
  if (error) throw dbError(error)
  return { data: (data ?? []) as Course[], total: count ?? 0 }
}

export async function getCourses(): Promise<Course[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("courses")
    .select("id, title, description, price, thumbnail_url, is_published, created_at")
    .order("created_at", { ascending: false })
  if (error) throw dbError(error)
  return (data ?? []) as Course[]
}

export async function getCourseById(id: string): Promise<Course> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("courses")
    .select("*, lessons(*)")
    .eq("id", id)
    .single()
  if (error) throw dbError(error)
  return data as Course
}

export async function getCourseByIdAdmin(id: string): Promise<Course> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("courses")
    .select("id, title, description, price, thumbnail_url, is_published, created_at")
    .eq("id", id)
    .single()
  if (error) throw dbError(error)
  return data as Course
}

export async function createCourse(values: CourseFormValues): Promise<Course> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("courses")
    .insert({
      title: values.title,
      description: values.description ?? null,
      price: values.is_free ? 0 : values.price,
      thumbnail_url: values.thumbnail_url ?? null,
      is_published: values.is_published,
    })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/courses")
  return data as Course
}

export async function updateCourse(id: string, values: CourseFormValues): Promise<Course> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("courses")
    .update({
      title: values.title,
      description: values.description ?? null,
      price: values.is_free ? 0 : values.price,
      thumbnail_url: values.thumbnail_url ?? null,
      is_published: values.is_published,
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/courses")
  return data as Course
}

export async function deleteCourse(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("courses").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/courses")
}
