"use server";

import { createClient } from "@/lib/supabase/server";
import type { ResetPasswordInput } from "@/schemas/auth.schema";

export async function resetPasswordAction(
  data: ResetPasswordInput
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password: data.password });

  if (error) return { error: error.message };

  return { success: true };
}
