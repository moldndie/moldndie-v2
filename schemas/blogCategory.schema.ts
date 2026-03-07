import { z } from "zod"

export const blogCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers and hyphens"),
})

export type BlogCategoryFormValues = z.infer<typeof blogCategorySchema>
