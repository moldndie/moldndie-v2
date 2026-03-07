import { createClient } from "@/lib/supabase/server"
import { getCurrentUser, isAdmin } from "@/services/auth.service"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard/DashboardLayout"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const admin = await isAdmin(user.id)
  if (!admin) redirect("/dashboard")

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single()

  return (
    <DashboardLayout
      user={{
        email: user.email,
        displayName: profile?.full_name ?? null,
      }}
    >
      {children}
    </DashboardLayout>
  )
}
