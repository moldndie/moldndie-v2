"use server"

import { createClient } from "@/lib/supabase/server"

export async function signInWithGoogleAction(
  callbackUrl?: string
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const next = callbackUrl ?? "/"

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (error) return { error: error.message }
  return { url: data.url }
}
