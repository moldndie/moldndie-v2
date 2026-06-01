import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Handles email-verification and invite-accept links that carry a token_hash.
 * Supabase sends these when the email template's redirect URL points here.
 *
 * Query params (set by Supabase):
 *   token_hash – the OTP token
 *   type        – "email" (signup confirm) | "invite" | "recovery"
 *   next        – optional override for the post-verify destination
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });

    if (!error) {
      const destination =
        next ??
        (type === "invite" ? "/set-password" : type === "recovery" ? "/reset-password" : "/dashboard");
      return NextResponse.redirect(`${origin}${destination}`);
    }

    // Token expired or already used.
    return NextResponse.redirect(
      `${origin}/login?error=verification_failed`
    );
  }

  return NextResponse.redirect(`${origin}/login?error=invalid_link`);
}
