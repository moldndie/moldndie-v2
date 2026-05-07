import { z } from "zod"

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  image_path: z.string().min(1, "Image is required"),
  event_date: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  category_id: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
})

export type EventFormValues = z.infer<typeof eventSchema>

export const eventCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
})

export type EventCategoryFormValues = z.infer<typeof eventCategorySchema>
