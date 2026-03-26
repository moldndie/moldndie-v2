"use server"

import { createAdminClient } from "@/lib/supabase/admin"
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

  const emailMap: Record<string, string | null> = {}
  for (const u of authResult.data.users) {
    emailMap[u.id] = u.email ?? null
  }

  return (profilesResult.data ?? []).map((p) => ({
    ...p,
    email: emailMap[p.id] ?? null,
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
  password: string
  role: "admin" | "user"
}): Promise<Profile> {
  const admin = createAdminClient()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
  })
  if (authError) throw dbError(authError)

  const userId = authData.user.id
  const { data, error } = await admin
    .from("profiles")
    .insert({ id: userId, role: payload.role })
    .select()
    .single()
  if (error) throw dbError(error)

  revalidatePath("/dashboard/users")
  return { ...data, email: payload.email } as Profile
}
