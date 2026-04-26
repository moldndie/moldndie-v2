import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Academy | Admin" }

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Academy"
        description="Manage academy courses and lessons."
        action={<Button>Create Course</Button>}
      />
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
        No courses yet. Courses table will appear here.
      </div>
    </div>
  )
}
