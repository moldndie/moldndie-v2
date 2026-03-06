import { createClient } from "@/lib/supabase/server";
import type { Profile, ProfileUpdateData } from "@/types/profile";

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: ProfileUpdateData
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) return { error: error.message };
  return { error: null };
}
