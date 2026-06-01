"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import type { ForgotPasswordInput } from "@/schemas/auth.schema";

export async function forgotPasswordAction(
  data: ForgotPasswordInput
): Promise<{ error?: string; success?: boolean }> {
  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: data.email,
  });

  // Always return success to avoid exposing whether an email exists
  if (linkError) return { success: true };

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { error: "Email service is not configured." };

  const confirmUrl = `${siteUrl}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=recovery`;
  const fromEmail = process.env.FROM_EMAIL ?? "noreply@moldndie.com";
  const resend = new Resend(resendKey);

  const { error: emailError } = await resend.emails.send({
    from: `MoldNdie <${fromEmail}>`,
    to: data.email,
    subject: "Reset your MoldNdie password",
    html: buildResetPasswordEmail(confirmUrl, siteUrl),
  });

  if (emailError) return { error: `Failed to send email: ${emailError.message}` };

  return { success: true };
}

function buildResetPasswordEmail(resetUrl: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your MoldNdie password</title>
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
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#7b2d12;">Password Reset</p>
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;line-height:1.3;color:#18181b;">Reset your password</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#52525b;">
                We received a request to reset the password for your <strong style="color:#18181b;">MoldNdie</strong> account.
                Click the button below to choose a new password.
              </p>
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px;">
                <tr>
                  <td style="border-radius:8px;background-color:#7b2d12;">
                    <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.01em;">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr><td style="border-top:1px solid #e4e4e7;"></td></tr>
              </table>
              <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#71717a;">
                &#9432;&nbsp; This link will expire in <strong>1 hour</strong>. If you didn&apos;t request a password reset, you can safely ignore this email — your password won&apos;t change.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.6;color:#a1a1aa;">
                If the button above doesn&apos;t work, copy and paste this link into your browser:<br />
                <a href="${resetUrl}" style="color:#7b2d12;word-break:break-all;text-decoration:underline;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#fafafa;padding:24px 40px;border-radius:0 0 12px 12px;border:1px solid #e4e4e7;border-top:none;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#a1a1aa;">You received this email because a password reset was requested for your MoldNdie account.</p>
              <p style="margin:0;font-size:12px;color:#a1a1aa;">If you didn&apos;t request this, you can safely ignore this email.</p>
              <p style="margin:16px 0 0;font-size:11px;color:#d4d4d8;">&copy; MoldNdie. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
