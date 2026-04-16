"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SignupInput } from "@/schemas/auth.schema";

export async function signupAction(
  data: SignupInput
): Promise<{ error?: string; success?: boolean; role?: "admin" | "user"; emailVerificationSent?: boolean }> {
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already been registered")) {
      return { error: "An account with this email already exists." };
    }
    return { error: error.message };
  }

  if (authData.user) {
    // Use admin client to bypass RLS — the user may not have a session yet
    // (e.g. if email confirmation is required) so the regular client would fail.
    const admin = createAdminClient();
    await admin.from("profiles").upsert({
      id: authData.user.id,
      first_name: data.first_name,
      last_name: data.last_name,
      country_code: data.country_code || null,
      phone: data.phone || null,
      role: "user",
    });
  }

  // If Supabase requires email confirmation, no session is created yet.
  const emailVerificationSent = !authData.session;
  return { success: true, role: "user", emailVerificationSent };
}
