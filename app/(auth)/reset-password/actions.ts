"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ResetPasswordInput } from "@/schemas/auth.schema";

export async function resetPasswordAction(
  data: ResetPasswordInput
): Promise<{ error: string } | void> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password: data.password });

  if (error) return { error: error.message };

  redirect("/login");
}
