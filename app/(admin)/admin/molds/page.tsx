import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Library | Admin" }

export default function MoldsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Library"
        description="Manage tooling listings."
        action={<Button>Create Tooling</Button>}
      />
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
        No toolings yet. Toolings table will appear here.
      </div>
    </div>
  )
}
