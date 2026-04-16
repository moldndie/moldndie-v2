import { z } from "zod"

const DIFFICULTY_VALUES = ["simple", "moderate", "difficult", "sophisticated"] as const

export const moldSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    category_id: z.string().optional(),
    is_free: z.boolean(),
    // Always a number: 0 for free molds, > 0 for paid
    price: z.number(),
    preview_image: z.string().optional(),
    file_key: z.string().min(1, "Please upload a mold file"),
    difficulty: z.enum(DIFFICULTY_VALUES).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.is_free && data.price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price is required for paid molds",
        path: ["price"],
      })
    }
  })

export type MoldFormValues = z.infer<typeof moldSchema>
