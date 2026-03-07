"use server";

import { createClient } from "@/lib/supabase/server";
import type { ForgotPasswordInput } from "@/schemas/auth.schema";

export async function forgotPasswordAction(
  data: ForgotPasswordInput
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: true };
}
