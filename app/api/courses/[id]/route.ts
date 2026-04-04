import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: course, error } = await admin
    .from("courses")
    .select("id, title, description, price, thumbnail_url, intro_video, created_at")
    .eq("id", id)
    .single()

  if (error || !course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }

  const { data: lessons, error: lessonsError } = await admin
    .from("lessons")
    .select("id, title, order_index, video_url, pdf_url, video_path, pdf_path, file_path, is_free")
    .eq("course_id", id)
    .order("order_index")

  if (lessonsError) {
    return NextResponse.json({ error: lessonsError.message }, { status: 500 })
  }

  return NextResponse.json({ course, lessons: lessons ?? [] })
}
