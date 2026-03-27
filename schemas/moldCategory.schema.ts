import { z } from "zod"

export const moldCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers and hyphens"),
})

export type MoldCategoryFormValues = z.infer<typeof moldCategorySchema>
