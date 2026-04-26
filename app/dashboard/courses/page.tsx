import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { CoursesTable } from "@/components/tables/CoursesTable"

export const metadata: Metadata = { title: "Academy | Admin" }

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Academy" description="Manage academy courses." />
      <CoursesTable />
    </div>
  )
}
