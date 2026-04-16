"use server";

import { createClient } from "@/lib/supabase/server";
import type { LoginInput } from "@/schemas/auth.schema";

export async function loginAction(
  data: LoginInput
): Promise<{ error?: string; success?: boolean; unverified?: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed")) {
      return {
        error: "Please verify your email before continuing.",
        unverified: true,
      };
    }
    return { error: error.message };
  }

  return { success: true };
}
