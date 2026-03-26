import { z } from "zod"

const TARGET_TYPES = ["blog", "mold", "event", "supplier", "external"] as const

export const adSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    image_path: z.string().min(1, "Image is required"),
    target_type: z.enum(TARGET_TYPES),
    link: z.string().min(1, "Link is required"),
    is_active: z.boolean(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.target_type === "external") {
      try {
        new URL(data.link)
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Must be a valid URL (e.g. https://example.com)",
          path: ["link"],
        })
      }
    }
  })

export type AdFormValues = z.infer<typeof adSchema>
