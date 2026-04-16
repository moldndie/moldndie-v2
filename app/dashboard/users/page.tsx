import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { UsersTable } from "@/components/tables/UsersTable"
import { getCurrentUser } from "@/services/auth.service"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Users | Admin" }

export default async function UsersPage() {
  const currentUser = await getCurrentUser()

  let currentUserRole: "admin" | "user" = "user"
  if (currentUser) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single()
    if (data?.role === "admin") currentUserRole = "admin"
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage platform users." />
      <UsersTable currentUserRole={currentUserRole} currentUserId={currentUser?.id} />
    </div>
  )
}
