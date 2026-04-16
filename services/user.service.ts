"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Profile } from "@/types"

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

export async function getUsers(): Promise<Profile[]> {
  const admin = createAdminClient()

  const [profilesResult, authResult] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  if (profilesResult.error) throw dbError(profilesResult.error)
  if (authResult.error) throw dbError(authResult.error)

  const authMap: Record<string, { email: string | null; email_confirmed_at: string | null }> = {}
  for (const u of authResult.data.users) {
    authMap[u.id] = {
      email: u.email ?? null,
      email_confirmed_at: u.email_confirmed_at ?? null,
    }
  }

  return (profilesResult.data ?? []).map((p) => ({
    ...p,
    email: authMap[p.id]?.email ?? null,
    email_confirmed_at: authMap[p.id]?.email_confirmed_at ?? null,
  })) as Profile[]
}


export async function updateUser(id: string, payload: Partial<Profile>): Promise<Profile> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("profiles")
    .update(payload)
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/users")
  return data as Profile
}

export async function deactivateUser(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from("profiles")
    .update({ is_active: false })
    .eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/users")
}

export async function reactivateUser(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from("profiles")
    .update({ is_active: true })
    .eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/users")
}

export async function createUser(payload: {
  email: string
  first_name: string
  last_name: string
  phone?: string
  country_code?: string
  role: "admin" | "user"
}): Promise<Profile> {
  const admin = createAdminClient()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""

  // Invite the user — no plaintext password. Supabase sends a set-password email.
  const { data: authData, error: authError } = await admin.auth.admin.inviteUserByEmail(
    payload.email,
    {
      data: { first_name: payload.first_name, last_name: payload.last_name },
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    }
  )
  if (authError) throw dbError(authError)

  const userId = authData.user.id
  const { data, error } = await admin
    .from("profiles")
    .insert({
      id: userId,
      first_name: payload.first_name,
      last_name: payload.last_name,
      phone: payload.phone || null,
      country_code: payload.country_code || null,
      role: payload.role,
    })
    .select()
    .single()
  if (error) throw dbError(error)

  revalidatePath("/dashboard/users")
  return { ...data, email: payload.email, email_confirmed_at: null } as Profile
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({ type: "signup", email })
  if (error) throw dbError(error)
}

export async function resetPasswordForUser(email: string): Promise<void> {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  })
  if (error) throw dbError(error)
}

export async function deleteUser(
  id: string,
  requestingAdminId: string
): Promise<void> {
  if (id === requestingAdminId) {
    throw new Error("You cannot delete your own account.")
  }

  const admin = createAdminClient()

  // Anonymize personal data first — preserves FK integrity for any related rows
  // (orders, comments, etc.) while removing all PII.
  await admin
    .from("profiles")
    .update({
      first_name: null,
      last_name: null,
      phone: null,
      country_code: null,
      is_active: false,
    })
    .eq("id", id)

  // Hard-delete the auth user. If the profiles table has ON DELETE CASCADE this
  // will also drop the now-anonymized profile row automatically.
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) throw dbError(error)

  revalidatePath("/dashboard/users")
}
