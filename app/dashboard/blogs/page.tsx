import { Metadata } from "next"
import { Suspense } from "react"
import PageHeader from "@/components/dashboard/PageHeader"
import { BlogTable } from "@/modules/blog/components/BlogTable"
import { CategoriesTable } from "@/modules/blog/components/CategoriesTable"
import { TagsTable } from "@/modules/blog/components/TagsTable"
import { BlogTabs } from "@/modules/blog/components/BlogTabs"

export const metadata: Metadata = { title: "Blog | Admin" }

interface BlogsPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function BlogsPage({ searchParams }: BlogsPageProps) {
  const { tab = "blogs" } = await searchParams

  return (
    <div className="space-y-6">
      <PageHeader title="Blog" description="Manage blog posts and categories." />

      <Suspense>
        <BlogTabs />
      </Suspense>

      {tab === "categories" && <CategoriesTable />}
      {tab === "tags" && <TagsTable />}
      {(tab === "blogs" || !["categories", "tags"].includes(tab)) && <BlogTable />}
    </div>
  )
}
