import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { BlogForm } from "@/modules/blog/components/BlogForm"
import { getBlogCategories, getBlogTags } from "@/services/blog.service"

export const metadata: Metadata = { title: "Create Blog | Admin" }

export default async function CreateBlogPage() {
  const [categories, tags] = await Promise.all([getBlogCategories(), getBlogTags()])

  return (
    <div className="space-y-6">
      <PageHeader title="Create Blog" description="Write a new blog post." />
      <BlogForm categories={categories} tags={tags} />
    </div>
  )
}
