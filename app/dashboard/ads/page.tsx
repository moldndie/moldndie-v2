import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Ads | Admin" }

export default function AdsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ads"
        description="Manage advertisements."
        action={<Button>Create Ad</Button>}
      />
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
        No ads yet. Ads table will appear here.
      </div>
    </div>
  )
}
