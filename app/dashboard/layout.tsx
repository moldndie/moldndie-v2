import { createClient } from "@/lib/supabase/server"
import { getCurrentUser, isAdmin } from "@/services/auth.service"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard/DashboardLayout"

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const admin = await isAdmin(user.id)
  if (!admin) redirect("/")

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single()

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || null

  return (
    <DashboardLayout
      user={{
        email: user.email,
        displayName,
      }}
    >
      {children}
    </DashboardLayout>
  )
}
