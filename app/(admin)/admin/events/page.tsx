import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Events | Admin" }

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Manage platform events."
        action={<Button>Create Event</Button>}
      />
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
        No events yet. Events table will appear here.
      </div>
    </div>
  )
}
