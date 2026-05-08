import { z } from "zod"

export const courseSchema = z
  .object({
    title:        z.string().min(1, "Title is required"),
    description:  z.string().optional(),
    is_free:      z.boolean(),
    price:        z.number(),
    thumbnail_url: z.string().optional(),
    is_published: z.boolean(),
    category_id:  z.string().nullable().optional(),
    trainee_level: z
      .enum(["beginner", "intermediate", "expert"])
      .nullable()
      .optional(),
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
