"use server";

import { getCurrentUser } from "@/services/auth.service";
import { updateProfile } from "@/services/profile.service";
import type { ProfileInput } from "@/schemas/profile.schema";

type Result = { error: string; success: false } | { error: null; success: true };

export async function updateProfileAction(data: ProfileInput): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated.", success: false };

  const { error } = await updateProfile(user.id, {
    first_name: data.first_name,
    last_name: data.last_name,
    phone: data.phone || undefined,
    country_code: data.country_code || undefined,
  });

  if (error) return { error, success: false };
  return { error: null, success: true };
}
