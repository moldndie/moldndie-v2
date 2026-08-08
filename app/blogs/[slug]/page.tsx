import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { FileText } from "lucide-react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import { getBlogBySlug, getRelatedBlogs, getBlogLikeData, getBlogComments } from "@/services/blog.service"
import { BlockRenderer } from "@/modules/blog/components/BlockRenderer"
import { getFileUrl } from "@/lib/utils"
import { docToText } from "@/lib/richtext"
import RichTextRenderer from "@/components/editor/RichTextRenderer"
import { LikeButton } from "../_components/LikeButton"
import { CommentsSection } from "../_components/CommentsSection"
import { ShareButtons } from "../_components/ShareButtons"
import { createClient } from "@/lib/supabase/server"
import { AdSlot } from "@/components/ads/AdSlot"
import { ContentViewTracker } from "@/components/analytics/ContentViewTracker"
import { ViewCount } from "@/components/analytics/ViewCount"
import { Suspense } from "react"
import type { Blog } from "@/types"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const blog = await getBlogBySlug(slug)
  if (!blog) return { title: "Blog Not Found" }
  // Rich text now — meta tags need the plain-text form.
  const intro = docToText(blog.introduction)
  return {
    title: blog.title,
    description: intro || undefined,
    openGraph: {
      title: blog.title,
      description: intro || undefined,
      images: blog.cover_image_path ? [getFileUrl(blog.cover_image_path)] : [],
    },
  }
}

function RelatedBlogCard({ blog }: { blog: Blog }) {
  return (
    <Link
      href={`/blogs/${blog.slug}`}
      className="group flex flex-col rounded-2xl border border-zinc-100 bg-white overflow-hidden hover:border-zinc-200 hover:shadow-md transition-all duration-200"
    >
      <div className="relative aspect-video w-full bg-white overflow-hidden">
        {blog.cover_image_path ? (
          <Image
            src={getFileUrl(blog.cover_image_path)}
            alt={blog.title}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText size={28} className="text-zinc-300" strokeWidth={1} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        {blog.category && (
          <span className="inline-block w-fit text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {blog.category.name}
          </span>
        )}
        <p className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {blog.title}
        </p>
        {blog.introduction && (
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
            {docToText(blog.introduction)}
          </p>
        )}
      </div>
    </Link>
  )
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params
  const blog = await getBlogBySlug(slug)

  if (!blog) notFound()

  type TagRelation = { tag_id: string; tag: { id: string; name: string; slug: string } | null }
  const tagRelations = ((blog as unknown as { blog_tag_relations?: TagRelation[] })
    .blog_tag_relations ?? [])
  const tagIds = tagRelations.map((r) => r.tag_id)
  const blogTags = tagRelations.map((r) => r.tag).filter(Boolean) as { id: string; name: string; slug: string }[]

  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()

  const [related, likeData, comments] = await Promise.all([
    getRelatedBlogs(blog.id, blog.category_id, tagIds),
    getBlogLikeData(blog.id),
    getBlogComments(blog.id),
  ])

  const date = new Date(blog.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const blocks = (blog.blocks ?? []).sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        {/* Cover image — constrained to content width, natural aspect ratio */}
        {blog.cover_image_path && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-2">
            <div className="overflow-hidden bg-white flex items-center justify-center">
              <Image
                src={getFileUrl(blog.cover_image_path)}
                alt={blog.title}
                width={0}
                height={0}
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 90vw, 1280px"
                style={{ width: "100%", height: "auto", maxHeight: 600, objectFit: "contain" }}
                priority
              />
            </div>
          </div>
        )}

        {/* ── Article ── */}
        <article className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="mb-6">
            <PublicBreadcrumb crumbs={[{ label: "Blog", href: "/blogs" }, { label: blog.title }]} />
          </div>

          <ContentViewTracker contentType="blog" contentId={blog.id} />

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {blog.category && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                {blog.category.name}
              </span>
            )}
            <span className="text-xs text-zinc-400">{date}</span>
            <Suspense fallback={null}>
              <ViewCount contentType="blog" contentId={blog.id} />
            </Suspense>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 leading-tight mb-4">
            {blog.title}
          </h1>

          {blog.introduction && (
            <RichTextRenderer
              content={blog.introduction}
              className="text-base text-zinc-500 leading-relaxed mb-6 border-l-4 border-primary/30 pl-4"
            />
          )}

          {blogTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {blogTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blogs?tags=${tag.id}`}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {blocks.length > 0 && <hr className="border-zinc-100 mb-8" />}
          {blocks.length > 0 && (
            <div className="prose prose-zinc prose-sm sm:prose-base max-w-none">
              <BlockRenderer blocks={blocks} />
            </div>
          )}

          {/* Like + Share */}
          <div className="mt-10 pt-6 border-t border-zinc-100 space-y-4">
            <div className="flex items-center gap-3">
              <LikeButton
                blogId={blog.id}
                initialLiked={likeData.liked}
                initialCount={likeData.count}
                isLoggedIn={!!user}
              />
              <span className="text-xs text-zinc-400">
                {likeData.count === 1 ? "1 like" : `${likeData.count} likes`}
              </span>
            </div>
            <ShareButtons
              url={`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/blogs/${blog.slug}`}
              title={blog.title}
              image={blog.cover_image_path ? getFileUrl(blog.cover_image_path) : undefined}
            />
          </div>

          <CommentsSection
            blogId={blog.id}
            initialComments={comments}
            currentUserId={user?.id ?? null}
          />
        </article>

        {/* ── Related Articles ── */}
        {related.length > 0 && (
          <section className="border-t border-zinc-100 bg-zinc-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
              <h2 className="text-base font-bold text-zinc-900 mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {related.map((r) => (
                  <RelatedBlogCard key={r.id} blog={r} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Sponsored ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <AdSlot page="blog" className="max-w-md mx-auto" />
        </div>
      </main>
      <Footer />
    </div>
  )
}
