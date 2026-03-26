import { z } from "zod"

export const courseSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    is_free: z.boolean(),
    price: z.number(),
    thumbnail: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.is_free && data.price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price is required for paid courses",
        path: ["price"],
      })
    }
  })

export type CourseFormValues = z.infer<typeof courseSchema>
