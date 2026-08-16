import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { FileText } from "lucide-react"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import { getBlogPreview, getRelatedBlogs, getBlogLikeData, getBlogComments } from "@/services/blog.service"
import { getCurrentUser, isAdmin } from "@/services/auth.service"
import { BlockRenderer } from "@/modules/blog/components/BlockRenderer"
import { getFileUrl } from "@/lib/utils"
import { docToText } from "@/lib/richtext"
import RichTextRenderer from "@/components/editor/RichTextRenderer"
import { LikeButton } from "@/app/blogs/_components/LikeButton"
import { CommentsSection } from "@/app/blogs/_components/CommentsSection"
import { createClient } from "@/lib/supabase/server"
import { AdSlot } from "@/components/ads/AdSlot"
import { PreviewBanner } from "./_components/PreviewBanner"
import type { Blog } from "@/types"

interface Props {
  params: Promise<{ id: string }>
}

// No metadata generation — preview pages should not be indexed.
export const metadata = { robots: "noindex,nofollow" }

function RelatedBlogCard({ blog }: { blog: Blog }) {
  return (
    <Link
      href={`/blogs/${blog.slug}`}
      className="group flex flex-col rounded-2xl border border-zinc-100 bg-white overflow-hidden hover:border-zinc-200 hover:shadow-md transition-all duration-200"
    >
      <div className="relative aspect-video w-full bg-zinc-100 overflow-hidden">
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

export default async function BlogPreviewPage({ params }: Props) {
  // ── Auth gate — admin only ────────────────────────────────────────────────
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const admin = await isAdmin(user.id)
  if (!admin) redirect("/")

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { id } = await params
  const blog = await getBlogPreview(id)
  if (!blog) notFound()

  type TagRelation = { tag_id: string; tag: { id: string; name: string; slug: string } | null }
  const tagRelations = ((blog as unknown as { blog_tag_relations?: TagRelation[] })
    .blog_tag_relations ?? [])
  const tagIds = tagRelations.map((r) => r.tag_id)
  const blogTags = tagRelations.map((r) => r.tag).filter(Boolean) as {
    id: string; name: string; slug: string
  }[]

  const serverClient = await createClient()
  const { data: { user: sessionUser } } = await serverClient.auth.getUser()

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
    <div className="min-h-screen bg-white pt-10">
      <PreviewBanner
        blogId={blog.id}
        blogSlug={blog.slug}
        isPublished={blog.is_published}
      />

      <main>
        {/* ── Article header ── */}
        <div className="w-fullpx-4 sm:px-6 pt-10">
          <PublicBreadcrumb
            crumbs={[
              { label: "Blog", href: "/blogs" },
              { label: blog.title },
            ]}
          />

          <div className="flex flex-wrap items-center gap-2.5 mt-6">
            {blog.category && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                {blog.category.name}
              </span>
            )}
            <span className="text-xs text-zinc-400">{date}</span>

            {/* Draft watermark — only visible when unpublished */}
            {!blog.is_published && (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Draft — not published
              </span>
            )}
          </div>

          <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-zinc-900 leading-tight tracking-tight">
            {blog.title}
          </h1>

          {blog.introduction && (
            <RichTextRenderer
              content={blog.introduction}
              className="mt-4 text-lg text-zinc-500 leading-relaxed"
            />
          )}

          {blogTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
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
        </div>

        {/* ── Cover image ── */}
        {blog.cover_image_path && (
          <div className="w-fullpx-4 sm:px-6 mt-8">
            <div className="overflow-hidden bg-white">
              <Image
                src={getFileUrl(blog.cover_image_path)}
                alt={blog.title}
                width={0}
                height={0}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 896px"
                style={{ width: "100%", height: "auto", maxHeight: 560, objectFit: "contain" }}
                priority
              />
            </div>
          </div>
        )}

        {/* ── Article body ── */}
        <article className="w-fullpx-4 sm:px-6 py-10">
          {blocks.length > 0 && (
            <div className="prose prose-zinc prose-base max-w-none">
              <BlockRenderer blocks={blocks} />
            </div>
          )}

          {/* Like — functional even in preview */}
          <div className="mt-12 pt-6 border-t border-zinc-100 flex items-center gap-3">
            <LikeButton
              blogId={blog.id}
              initialLiked={likeData.liked}
              initialCount={likeData.count}
              isLoggedIn={!!sessionUser}
            />
            <span className="text-xs text-zinc-400">
              {likeData.count === 1 ? "1 like" : `${likeData.count} likes`}
            </span>
          </div>

          <CommentsSection
            blogId={blog.id}
            initialComments={comments}
            currentUserId={sessionUser?.id ?? null}
          />
        </article>

        {/* ── Related Articles ── */}
        {related.length > 0 && (
          <section className="border-t border-zinc-100 bg-zinc-50/60">
            <div className="w-fullpx-4 sm:px-6 py-12">
              <h2 className="text-lg font-bold text-zinc-900 mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {related.map((r) => (
                  <RelatedBlogCard key={r.id} blog={r} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Ad slot ── */}
        <div className="w-fullpx-4 sm:px-6 py-8">
          <AdSlot page="blog" className="max-w-md mx-auto" />
        </div>
      </main>
    </div>
  )
}
