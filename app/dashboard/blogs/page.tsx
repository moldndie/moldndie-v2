import { Metadata } from "next"
import { Suspense } from "react"
import PageHeader from "@/components/dashboard/PageHeader"
import { BlogTable } from "@/modules/blog/components/BlogTable"
import { CategoriesTable } from "@/modules/blog/components/CategoriesTable"
import { TagsTable } from "@/modules/blog/components/TagsTable"
import { BlogTabs } from "@/modules/blog/components/BlogTabs"
import { getBlogs } from "@/services/blog.service"
import { getCategories } from "@/services/blogCategory.service"
import { getTags } from "@/services/blogTag.service"

export const metadata: Metadata = { title: "Blogs | Admin" }

interface BlogsPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function BlogsPage({ searchParams }: BlogsPageProps) {
  const { tab = "blogs" } = await searchParams

  return (
    <div className="space-y-6">
      <PageHeader title="Blogs" description="Manage your blog posts and categories." />

      <Suspense>
        <BlogTabs />
      </Suspense>

      {tab === "categories" && <CategoriesTab />}
      {tab === "tags" && <TagsTab />}
      {(tab === "blogs" || !["categories", "tags"].includes(tab)) && <BlogsTab />}
    </div>
  )
}

async function BlogsTab() {
  const blogs = await getBlogs()
  return <BlogTable data={blogs} />
}

async function CategoriesTab() {
  const categories = await getCategories()
  return <CategoriesTable data={categories} />
}

async function TagsTab() {
  const tags = await getTags()
  return <TagsTable data={tags} />
}
