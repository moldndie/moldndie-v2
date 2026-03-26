export interface CourseLesson {
  id: string
  course_id: string
  title: string
  video_url: string | null
  pdf_key: string | null
  position: number
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
  thumbnail: string | null
  intro_video: string | null
  created_at: string
  lessons?: CourseLesson[]
  resources?: CourseResource[]
}
