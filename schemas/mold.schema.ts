import { z } from "zod"

export const moldSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category_id: z.string().optional(),
  price: z.number().min(0, "Price must be 0 or more").optional(),
  preview_image: z.string().optional(),
  download_url: z.string().optional(),
})

export type MoldFormValues = z.infer<typeof moldSchema>
