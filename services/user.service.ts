"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Resend } from "resend"
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
  country_code?: string
  role: "admin" | "user"
}): Promise<Profile> {
  const admin = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""

  // Generate the invite link without sending via Supabase email (bypasses rate limits)
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "invite",
    email: payload.email,
    options: {
      data: { first_name: payload.first_name, last_name: payload.last_name },
      redirectTo: `${siteUrl}/auth/callback?next=/set-password`,
    },
  })
  if (linkError) {
    const msg = linkError.message ?? ""
    if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exist")) {
      throw new Error("A user with this email already exists.")
    }
    throw new Error(msg || "Failed to generate invitation link")
  }

  const inviteUrl = linkData.properties.action_link

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) throw new Error("RESEND_API_KEY is not set in environment variables")

  const fromEmail = process.env.FROM_EMAIL ?? "noreply@moldndie.com"

  try {
    const resend = new Resend(resendKey)
    const { error: emailError } = await resend.emails.send({
      from: `MoldNdie <${fromEmail}>`,
      to: payload.email,
      subject: "You've been invited to join MoldNdie",
      html: buildInviteEmail(inviteUrl, payload.first_name),
    })
    if (emailError) {
      throw new Error(emailError.message)
    }
  } catch (e) {
    // Clean up the orphaned auth user so the invite can be retried
    await admin.auth.admin.deleteUser(linkData.user.id).catch(() => {})
    const msg = e instanceof Error ? e.message : "Unknown error"
    throw new Error(`Failed to send invitation email: ${msg}`)
  }

  const authData = linkData

  const userId = authData.user.id

  // Re-invite: Supabase reuses the existing auth user for unaccepted invites,
  // so the profile may already exist. Return it as-is rather than trying to insert.
  const { data: existing } = await admin
    .from("profiles")
    .select()
    .eq("id", userId)
    .single()

  if (existing) {
    revalidatePath("/dashboard/users")
    return { ...existing, email: payload.email, email_confirmed_at: null } as Profile
  }

  const { data, error } = await admin
    .from("profiles")
    .insert({
      id: userId,
      first_name: payload.first_name,
      last_name: payload.last_name,
      country_code: payload.country_code || null,
      role: payload.role,
    })
    .select()
    .single()
  if (error) {
    await admin.auth.admin.deleteUser(userId).catch(() => {})
    throw new Error(`Profile creation failed: ${error.message}`)
  }

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

function buildInviteEmail(inviteUrl: string, firstName: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been invited to MoldNdie</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;padding:48px 16px;">
    <tr>
      <td align="center" valign="top">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <tr>
            <td style="background-color:#7b2d12;padding:32px 40px;border-radius:12px 12px 0 0;text-align:center;">
              <img src="${siteUrl}/assets/logo-white-v2.png" alt="MoldNdie" height="38" style="display:block;margin:0 auto;max-width:160px;height:auto;" />
            </td>
          </tr>

          <tr>
            <td style="background-color:#ffffff;padding:48px 40px 40px;border-left:1px solid #e4e4e7;border-right:1px solid #e4e4e7;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#7b2d12;">You're invited</p>
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;line-height:1.3;color:#18181b;">Join MoldNdie</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#52525b;">
                Hi ${firstName},<br /><br />
                An administrator has invited you to access the <strong style="color:#18181b;">MoldNdie</strong> platform.
                Click the button below to accept your invitation and set your password.
              </p>
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px;">
                <tr>
                  <td style="border-radius:8px;background-color:#7b2d12;">
                    <a href="${inviteUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.01em;">
                      Accept Invitation &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr><td style="border-top:1px solid #e4e4e7;"></td></tr>
              </table>
              <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#71717a;">
                &#9432;&nbsp; This invitation link will expire in <strong>24 hours</strong>. If it expires, contact your administrator to request a new one.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.6;color:#a1a1aa;">
                If the button above doesn't work, copy and paste this link into your browser:<br />
                <a href="${inviteUrl}" style="color:#7b2d12;word-break:break-all;text-decoration:underline;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#fafafa;padding:24px 40px;border-radius:0 0 12px 12px;border:1px solid #e4e4e7;border-top:none;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#a1a1aa;">You received this email because an admin invited you to MoldNdie.</p>
              <p style="margin:0;font-size:12px;color:#a1a1aa;">If you didn't expect this, you can safely ignore this email.</p>
              <p style="margin:16px 0 0;font-size:11px;color:#d4d4d8;">&copy; MoldNdie. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
