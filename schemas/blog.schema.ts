import { z } from "zod"

export const blogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers and hyphens"),
  introduction: z.string().optional(),
  cover_image_path: z.string().optional(),
  category_id: z.string().optional(),
  is_published: z.boolean(),
})

export type BlogFormValues = z.infer<typeof blogSchema>
