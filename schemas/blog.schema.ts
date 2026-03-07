import { z } from "zod"

export const blogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers and hyphens"),
  excerpt: z.string().optional(),
  cover_image: z.string().optional(),
  category_id: z.string().optional(),
  published: z.boolean().default(false),
})

export type BlogFormValues = z.infer<typeof blogSchema>
