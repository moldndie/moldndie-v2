import { Metadata } from "next"
import { Suspense } from "react"
import PageHeader from "@/components/dashboard/PageHeader"
import { BlogTable } from "@/modules/blog/components/BlogTable"
import { CategoriesTable } from "@/modules/blog/components/CategoriesTable"
import { TagsTable } from "@/modules/blog/components/TagsTable"
import { BlogTabs } from "@/modules/blog/components/BlogTabs"
import { getBlogs } from "@/services/blog.service"

export const metadata: Metadata = { title: "Blogs | Admin" }

interface BlogsPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function BlogsPage({ searchParams }: BlogsPageProps) {
  const { tab = "blogs" } = await searchParams
  const blogs = tab === "blogs" || !["categories", "tags"].includes(tab)
    ? await getBlogs()
    : []

  return (
    <div className="space-y-6">
      <PageHeader title="Blogs" description="Manage your blog posts and categories." />

      <Suspense>
        <BlogTabs />
      </Suspense>

      {tab === "categories" && <CategoriesTable />}
      {tab === "tags" && <TagsTable />}
      {(tab === "blogs" || !["categories", "tags"].includes(tab)) && <BlogTable data={blogs} />}
    </div>
  )
}
