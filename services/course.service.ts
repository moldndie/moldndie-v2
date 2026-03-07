"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Course } from "@/types"
import type { CourseFormValues } from "@/schemas/course.schema"

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

export async function getCourses(): Promise<Course[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw dbError(error)
  return (data ?? []) as Course[]
}

export async function getCourseById(id: string): Promise<Course> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("courses")
    .select("*, lessons:course_lessons(*), resources:course_resources(*)")
    .eq("id", id)
    .single()
  if (error) throw dbError(error)
  return data as Course
}

export async function createCourse(values: CourseFormValues): Promise<Course> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("courses")
    .insert({
      title: values.title,
      description: values.description ?? null,
      price: values.price ?? null,
      thumbnail: values.thumbnail ?? null,
      intro_video: values.intro_video ?? null,
    })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/courses")
  return data as Course
}

export async function updateCourse(id: string, values: CourseFormValues): Promise<Course> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("courses")
    .update({
      title: values.title,
      description: values.description ?? null,
      price: values.price ?? null,
      thumbnail: values.thumbnail ?? null,
      intro_video: values.intro_video ?? null,
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/courses")
  return data as Course
}

export async function deleteCourse(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("courses").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/courses")
}
