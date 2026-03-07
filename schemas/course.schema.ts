import { z } from "zod"

export const courseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or more").optional(),
  thumbnail: z.string().optional(),
  intro_video: z.string().optional(),
})

export type CourseFormValues = z.infer<typeof courseSchema>
