import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Users | Admin" }

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage platform users."
        action={<Button>Invite User</Button>}
      />
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
        No users yet. Users table will appear here.
      </div>
    </div>
  )
}
