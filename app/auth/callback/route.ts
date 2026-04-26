import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && sessionData?.user) {
      const user = sessionData.user

      // Ensure profile row exists for OAuth users (Google login creates auth user but not profile)
      if (user.app_metadata?.provider === "google" || user.identities?.some((i) => i.provider === "google")) {
        const admin = createAdminClient()
        const { data: existing } = await admin
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single()

        if (!existing) {
          const fullName: string = user.user_metadata?.full_name ?? ""
          const nameParts = fullName.trim().split(" ")
          const firstName = nameParts[0] ?? ""
          const lastName = nameParts.slice(1).join(" ") || null
          const avatarUrl: string | null = user.user_metadata?.avatar_url ?? null

          await admin.from("profiles").insert({
            id: user.id,
            first_name: firstName || null,
            last_name: lastName,
            avatar_url: avatarUrl,
            role: "user",
            is_active: true,
          })
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=verification_failed`)
}
