import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { FileText, Heart, MessageSquare } from "lucide-react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { getFilteredPublishedBlogs, getBlogCategories, getBlogTags, getBlogCountsMap, type BlogSort } from "@/services/blog.service"
import { BlogPaginationBar } from "./_components/BlogPaginationBar"
import { getFileUrl } from "@/lib/utils"
import { BlogFiltersBar } from "./_components/BlogFiltersBar"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import type { Blog } from "@/types"

export const metadata: Metadata = {
  title: "Blog | MoldNdie",
  description: "Industry insights, guides, and news from the mold & die world.",
}

function BlogCard({ blog, likes, comments }: { blog: Blog; likes: number; comments: number }) {
  const date = new Date(blog.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return (
    <Link
      href={`/blogs/${blog.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-zinc-100 bg-white shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="aspect-video relative bg-zinc-50 overflow-hidden">
        {blog.cover_image_path ? (
          <Image
            src={getFileUrl(blog.cover_image_path)}
            alt={blog.title}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText size={36} className="text-zinc-200" strokeWidth={1} />
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {blog.category && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {blog.category.name}
            </span>
          )}
          <span className="text-xs text-zinc-400">{date}</span>
        </div>

        <h2 className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {blog.title}
        </h2>

        {blog.introduction && (
          <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed">
            {blog.introduction}
          </p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-xs font-medium text-primary group-hover:underline underline-offset-2">
            Read more →
          </span>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Heart className="size-3" />
              {likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3" />
              {comments}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

interface BlogsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const DEFAULT_PAGE_SIZE = 6

export default async function BlogsPage({ searchParams }: BlogsPageProps) {
  const params = await searchParams
  const q = typeof params.q === "string" ? params.q : undefined
  const categoryId = typeof params.category === "string" ? params.category : undefined
  const tagIds = typeof params.tags === "string"
    ? params.tags.split(",").filter(Boolean)
    : undefined
  const sort = typeof params.sort === "string" ? params.sort : undefined
  const page = typeof params.page === "string" ? Math.max(1, parseInt(params.page) || 1) : 1
  const pageSize = DEFAULT_PAGE_SIZE

  const { blogs, total } = await getFilteredPublishedBlogs({
    q, categoryId, tagIds, sort: sort as BlogSort | undefined, page, pageSize,
  })
  const totalPages = Math.ceil(total / pageSize)

  const [categories, tags, countsMap] = await Promise.all([
    getBlogCategories(),
    getBlogTags(),
    getBlogCountsMap(blogs.map((b) => b.id)),
  ])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          <div>
            <PublicBreadcrumb crumbs={[{ label: "Blog" }]} />
            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">
              Blog
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Industry insights, guides &amp; news from the mold &amp; die world
            </p>
          </div>

          <Suspense>
            <BlogFiltersBar
              categories={categories}
              tags={tags}
              currentQ={q ?? ""}
              currentCategory={categoryId ?? ""}
              currentTags={tagIds ?? []}
              currentSort={sort ?? "newest"}
            />
          </Suspense>

          {total > 0 && (
            <p className="text-xs text-zinc-400">
              {total} blog{total !== 1 ? "s" : ""} found
            </p>
          )}

          {blogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <FileText size={48} className="text-zinc-200 mb-4" strokeWidth={1} />
              <p className="text-zinc-500 font-medium">No blogs found</p>
              <p className="text-zinc-400 text-sm mt-1">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  likes={countsMap.get(blog.id)?.likes ?? 0}
                  comments={countsMap.get(blog.id)?.comments ?? 0}
                />
              ))}
            </div>
          )}

          <Suspense>
            <BlogPaginationBar
              currentPage={page}
              totalPages={totalPages}
            />
          </Suspense>

          <div className="pt-4">
            <Suspense fallback={null}>
              <AdSlotGrid page="blog" className="w-full" />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
