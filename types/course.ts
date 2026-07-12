export interface CourseLesson {
  id: string
  course_id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  video_url: string | null
  pdf_url: string | null
  video_path: string | null
  pdf_path: string | null
  file_path: string | null
  order_index: number
  is_free: boolean
}

export interface CourseResource {
  id: string
  course_id: string
  title: string
  file_url: string | null
}

export interface Course {
  id: string
  title: string
  description: string | null
  price: number | null
  thumbnail_url: string | null
  intro_video: string | null
  is_published: boolean
  category_id: string | null
  trainee_level: string | null
  created_at: string
  lessons?: CourseLesson[]
  resources?: CourseResource[]
}
