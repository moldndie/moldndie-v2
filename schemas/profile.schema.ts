import { z } from "zod";

export const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  country_code: z
    .string()
    .regex(/^[A-Z]{2}$/, "Must be a valid 2-letter country code (e.g. EG)")
    .optional()
    .or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
