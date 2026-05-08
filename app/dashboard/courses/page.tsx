import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { getAcademyCategories } from "@/services/academyCategory.service"
import AcademyPageClient from "./AcademyPageClient"

export const metadata: Metadata = { title: "Academy | Admin" }

export default async function CoursesPage() {
  const categories = await getAcademyCategories().catch(() => [])

  return (
    <div className="space-y-6">
      <PageHeader title="Academy" description="Manage academy courses and categories." />
      <AcademyPageClient initialCategories={categories} />
    </div>
  )
}
