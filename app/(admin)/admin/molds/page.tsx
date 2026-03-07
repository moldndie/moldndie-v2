import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Molds | Admin" }

export default function MoldsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Molds"
        description="Manage mold listings."
        action={<Button>Create Mold</Button>}
      />
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
        No molds yet. Molds table will appear here.
      </div>
    </div>
  )
}
