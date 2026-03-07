import { z } from "zod"

export const userEditSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  country_code: z
    .string()
    .refine((v) => !v || v.length === 2, "Must be a 2-letter country code")
    .optional(),
  role: z.enum(["admin", "user"]),
})

export type UserEditValues = z.infer<typeof userEditSchema>
