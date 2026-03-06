"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { LoginInput } from "@/schemas/auth.schema";

export async function loginAction(data: LoginInput): Promise<{ error: string } | void> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) return { error: error.message };

  redirect("/dashboard");
}
