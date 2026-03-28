import { z } from "zod"

export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  logo_path: z.string().optional(),
  website: z.string().optional(),
  category_id: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  sponsored: z.boolean(),
})

export type SupplierFormValues = z.infer<typeof supplierSchema>

export const supplierCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
})

export type SupplierCategoryFormValues = z.infer<typeof supplierCategorySchema>
