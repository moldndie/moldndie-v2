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
    .from("course_lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("position")
  if (error) throw dbError(error)
  return (data ?? []) as CourseLesson[]
}

export async function replaceLessons(
  courseId: string,
  lessons: { title: string; video_url: string; pdf_key: string | null; position: number }[]
): Promise<void> {
  const admin = createAdminClient()
  const { error: deleteError } = await admin
    .from("course_lessons")
    .delete()
    .eq("course_id", courseId)
  if (deleteError) throw dbError(deleteError)
  if (lessons.length === 0) return
  const { error: insertError } = await admin.from("course_lessons").insert(
    lessons.map((l) => ({ course_id: courseId, ...l }))
  )
  if (insertError) throw dbError(insertError)
}
