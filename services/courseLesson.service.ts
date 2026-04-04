"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { CourseLesson } from "@/types"

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

export async function getLessons(courseId: string): Promise<CourseLesson[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index")
  if (error) throw dbError(error)
  return (data ?? []) as CourseLesson[]
}

export interface LessonInput {
  title: string
  video_url?: string | null
  pdf_url?: string | null
  video_path?: string | null
  pdf_path?: string | null
  file_path?: string | null
  order_index: number
  is_free: boolean
}

export async function createLesson(
  courseId: string,
  input: LessonInput
): Promise<CourseLesson> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("lessons")
    .insert({
      course_id: courseId,
      title: input.title,
      video_url: input.video_url ?? null,
      pdf_url: input.pdf_url ?? null,
      video_path: input.video_path ?? null,
      pdf_path: input.pdf_path ?? null,
      file_path: input.file_path ?? null,
      order_index: input.order_index,
      is_free: input.is_free,
    })
    .select()
    .single()
  if (error) throw dbError(error)
  return data as CourseLesson
}

export async function updateLesson(
  id: string,
  input: LessonInput
): Promise<CourseLesson> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("lessons")
    .update({
      title: input.title,
      video_url: input.video_url ?? null,
      pdf_url: input.pdf_url ?? null,
      video_path: input.video_path ?? null,
      pdf_path: input.pdf_path ?? null,
      file_path: input.file_path ?? null,
      order_index: input.order_index,
      is_free: input.is_free,
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  return data as CourseLesson
}

export async function deleteLesson(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from("lessons").delete().eq("id", id)
  if (error) throw dbError(error)
}

export async function replaceLessons(
  courseId: string,
  lessons: { title: string; video_url?: string | null; pdf_url?: string | null; video_path?: string | null; pdf_path?: string | null; file_path?: string | null; order_index: number }[]
): Promise<void> {
  const admin = createAdminClient()
  const { error: deleteError } = await admin
    .from("lessons")
    .delete()
    .eq("course_id", courseId)
  if (deleteError) throw dbError(deleteError)
  if (lessons.length === 0) return
  const { error: insertError } = await admin.from("lessons").insert(
    lessons.map((l) => ({ course_id: courseId, ...l }))
  )
  if (insertError) throw dbError(insertError)
}
