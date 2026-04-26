import { z } from "zod"

export const AD_TARGET_TYPES = [
  "blog",
  "mold",
  "event",
  "supplier",
  "course",
  "global",
  "external",
] as const

export const AD_TARGET_LABELS: Record<string, string> = {
  blog: "Blog",
  mold: "Library",
  event: "Events",
  supplier: "Suppliers",
  course: "Academy",
  global: "Global (all pages)",
  external: "External Link",
}

export const adSchema = z.object({
  title: z.string().min(1, "Title is required"),
  image_path: z.string().min(1, "Image is required"),
  link: z.string().url("Must be a valid URL (e.g. https://example.com)"),
  target_type: z.enum(["blog", "mold", "event", "supplier", "course", "global", "external"], {
    message: "Target type is required",
  }),
  is_active: z.boolean(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
})

export type AdFormValues = z.infer<typeof adSchema>
