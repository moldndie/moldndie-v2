import { Metadata } from "next"
import { Suspense } from "react"
import PageHeader from "@/components/dashboard/PageHeader"
import { EventsTable } from "@/components/tables/EventsTable"
import { EventCategoriesTable } from "@/modules/event/components/EventCategoriesTable"
import { EventTabs } from "@/modules/event/components/EventTabs"

export const metadata: Metadata = { title: "Events | Admin" }

interface EventsPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { tab = "events" } = await searchParams

  return (
    <div className="space-y-6">
      <PageHeader title="Events" description="Manage platform events and categories." />

      <Suspense>
        <EventTabs />
      </Suspense>

      {tab === "categories" && <EventCategoriesTable />}
      {(tab === "events" || tab !== "categories") && <EventsTable />}
    </div>
  )
}
