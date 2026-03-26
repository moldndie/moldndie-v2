import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { CoursesTable } from "@/components/tables/CoursesTable"

export const metadata: Metadata = { title: "Courses | Admin" }

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Courses" description="Manage your courses." />
      <CoursesTable />
    </div>
  )
}
