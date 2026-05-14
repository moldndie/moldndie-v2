import { z } from "zod"

export const cmsPageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers and hyphens"),
  content: z.any().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  is_published: z.boolean(),
})

export type CmsPageFormValues = z.infer<typeof cmsPageSchema>
