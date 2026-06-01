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

export const userCreateSchema = z
  .object({
    invitation_method: z.enum(["email", "sms"]),
    email: z.string().optional(),
    phone: z.string().optional(),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    country_code: z
      .string()
      .refine((v) => !v || v.length === 2, "Must be a 2-letter country code")
      .optional(),
    role: z.enum(["admin", "user"]),
  })
  .superRefine((data, ctx) => {
    if (data.invitation_method === "email") {
      if (!data.email || data.email.trim() === "") {
        ctx.addIssue({ code: "custom", path: ["email"], message: "Email is required" })
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        ctx.addIssue({ code: "custom", path: ["email"], message: "Invalid email address" })
      }
    }
    if (data.invitation_method === "sms") {
      if (!data.phone || data.phone.trim() === "") {
        ctx.addIssue({ code: "custom", path: ["phone"], message: "Phone number is required" })
      }
    }
  })

export type UserCreateValues = z.infer<typeof userCreateSchema>
