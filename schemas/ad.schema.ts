import { z } from "zod"

export const AD_TARGET_TYPES = [
  "blog",
  "mold",
  "event",
  "supplier",
  "course",
  "external",
] as const

export const AD_TARGET_LABELS: Record<string, string> = {
  blog: "Blog Pages",
  mold: "Mold Pages",
  event: "Event Pages",
  supplier: "Supplier Pages",
  course: "Course Pages",
  external: "Global / External",
}

export const adSchema = z.object({
  title: z.string().min(1, "Title is required"),
  image_path: z.string().min(1, "Image is required"),
  link: z.string().url("Must be a valid URL (e.g. https://example.com)"),
  target_type: z.enum(["blog", "mold", "event", "supplier", "course", "external"], {
    required_error: "Target type is required",
  }),
  is_active: z.boolean(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
})

export type AdFormValues = z.infer<typeof adSchema>
