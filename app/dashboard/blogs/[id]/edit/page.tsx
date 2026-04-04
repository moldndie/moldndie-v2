import { Metadata } from "next"
import { notFound } from "next/navigation"
import PageHeader from "@/components/dashboard/PageHeader"
import { BlogForm } from "@/modules/blog/components/BlogForm"
import { getBlogById, getBlogCategories, getBlogTags, getBlogTagIds } from "@/services/blog.service"

export const metadata: Metadata = { title: "Edit Blog | Admin" }

interface EditBlogPageProps {
  params: Promise<{ id: string }>
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const { id } = await params
  const [blog, categories, tags, selectedTagIds] = await Promise.all([
    getBlogById(id).catch(() => null),
    getBlogCategories(),
    getBlogTags(),
    getBlogTagIds(id),
  ])

  if (!blog) notFound()

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Edit Blog" description={`Editing: ${blog.title}`} />
      <BlogForm blog={blog} categories={categories} tags={tags} selectedTagIds={selectedTagIds} />
    </div>
  )
}
