"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { SignupInput } from "@/schemas/auth.schema";

export async function signupAction(data: SignupInput): Promise<{ error: string } | void> {
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (error) return { error: error.message };

  if (authData.user) {
    await supabase.from("profiles").upsert({
      id: authData.user.id,
      first_name: data.first_name,
      last_name: data.last_name,
      country_code: data.country_code || null,
      phone: data.phone || null,
      role: "user",
    });
  }

  redirect("/dashboard");
}
