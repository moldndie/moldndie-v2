import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { CoursesTable } from "@/components/tables/CoursesTable"
import { getCourses } from "@/services/course.service"

export const metadata: Metadata = { title: "Courses | Admin" }

export default async function CoursesPage() {
  const courses = await getCourses()

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" description="Manage your courses." />
      <CoursesTable data={courses} />
    </div>
  )
}
