import { z } from "zod"

export const AD_PAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "homepage",    label: "Homepage" },
  { value: "blog",        label: "Blog" },
  { value: "academy",     label: "Academy" },
  { value: "library",     label: "Library" },
  { value: "engineering", label: "Engineering" },
  { value: "suppliers",   label: "Suppliers" },
  { value: "events",      label: "Events" },
  { value: "services",    label: "Services" },
]

export const adSchema = z.object({
  title: z.string().min(1, "Title is required"),
  image_path: z.string().min(1, "Image is required"),
  link: z.string().url("Must be a valid URL (e.g. https://example.com)"),
  target_pages: z.array(z.string()).min(1, "Select at least one target page"),
  is_active: z.boolean(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
})

export type AdFormValues = z.infer<typeof adSchema>
