"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { Blog, BlogCategory, BlogTag, BlogBlock } from "@/types"
import type { BlogFormValues } from "@/schemas/blog.schema"

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

async function generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  const supabase = createAdminClient()
  let slug = baseSlug
  let suffix = 0
  while (true) {
    let query = supabase.from("blogs").select("id").eq("slug", slug)
    if (excludeId) query = query.neq("id", excludeId)
    const { data } = await query.maybeSingle()
    if (!data) return slug
    suffix += 1
    slug = `${baseSlug}-${suffix}`
  }
}

export async function getBlogs(): Promise<Blog[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("blogs")
    .select("*, category:blog_categories(id,name,slug,created_at)")
    .order("created_at", { ascending: false })
  if (error) throw dbError(error)
  return (data ?? []) as unknown as Blog[]
}

export async function getPublishedBlogs(): Promise<Blog[]> {
  const { blogs } = await getFilteredPublishedBlogs({ pageSize: 9999 })
  return blogs
}

export type BlogSort = "newest" | "oldest" | "title_asc"

export async function getFilteredPublishedBlogs(filters: {
  q?: string
  categoryId?: string
  tagIds?: string[]
  sort?: BlogSort
  page?: number
  pageSize?: number
}): Promise<{ blogs: Blog[]; total: number }> {
  const supabase = createAdminClient()
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = filters.pageSize ?? 9
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Tag filter: get matching blog IDs via join table first
  let tagBlogIds: string[] | null = null
  if (filters.tagIds?.length) {
    const { data: relations } = await supabase
      .from("blog_tag_relations")
      .select("blog_id")
      .in("tag_id", filters.tagIds)
    tagBlogIds = [...new Set((relations ?? []).map((r: { blog_id: string }) => r.blog_id))]
    if (tagBlogIds.length === 0) return { blogs: [], total: 0 }
  }

  const orderMap: Record<BlogSort, { col: string; asc: boolean }> = {
    newest:    { col: "created_at", asc: false },
    oldest:    { col: "created_at", asc: true  },
    title_asc: { col: "title",      asc: true  },
  }
  const { col, asc } = orderMap[filters.sort ?? "newest"]

  let query = supabase
    .from("blogs")
    .select("*, category:blog_categories(id,name,slug,created_at)", { count: "exact" })
    .eq("is_published", true)

  if (filters.q) query = query.ilike("title", `%${filters.q}%`)
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId)
  if (tagBlogIds !== null) query = query.in("id", tagBlogIds)

  query = query.order(col, { ascending: asc }).range(from, to)

  const { data, error, count } = await query
  if (error) throw dbError(error)
  return { blogs: (data ?? []) as unknown as Blog[], total: count ?? 0 }
}

export async function getPublishedBlogsCount(): Promise<number> {
  const supabase = createAdminClient()
  const { count, error } = await supabase
    .from("blogs")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true)
  if (error) throw dbError(error)
  return count ?? 0
}

export async function getBlogBySlug(slug: string): Promise<Blog | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("blogs")
    .select("*, category:blog_categories(id,name,slug,created_at), blocks:blog_blocks(*), blog_tag_relations(tag_id, tag:blog_tags(id,name,slug))")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()
  if (error) throw dbError(error)
  return data as unknown as Blog | null
}

export async function getBlogById(id: string): Promise<Blog> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("blogs")
    .select("*, category:blog_categories(id,name,slug,created_at), blocks:blog_blocks(*)")
    .eq("id", id)
    .single()
  if (error) throw dbError(error)
  return data as Blog
}

export async function getBlogTagIds(blogId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blog_tag_relations")
    .select("tag_id")
    .eq("blog_id", blogId)
  if (error) throw dbError(error)
  return (data ?? []).map((r: { tag_id: string }) => r.tag_id)
}

export async function getRelatedBlogs(
  currentId: string,
  categoryId: string | null,
  tagIds: string[]
): Promise<Blog[]> {
  const supabase = createAdminClient()
  const seen = new Set<string>()
  const results: Blog[] = []

  const baseSelect = "id, title, slug, introduction, cover_image_path, created_at, category:blog_categories(id,name,slug,created_at)"

  // Category matches
  if (categoryId) {
    const { data } = await supabase
      .from("blogs")
      .select(baseSelect)
      .eq("is_published", true)
      .eq("category_id", categoryId)
      .neq("id", currentId)
      .order("created_at", { ascending: false })
      .limit(3)
    for (const b of data ?? []) {
      if (!seen.has(b.id)) { seen.add(b.id); results.push(b as unknown as Blog) }
    }
  }

  // Tag matches (only if we still need more)
  if (tagIds.length > 0 && results.length < 3) {
    const { data: relations } = await supabase
      .from("blog_tag_relations")
      .select("blog_id")
      .in("tag_id", tagIds)
      .neq("blog_id", currentId)
    const tagBlogIds = [...new Set((relations ?? []).map((r: { blog_id: string }) => r.blog_id))]
      .filter((id) => !seen.has(id))
    if (tagBlogIds.length > 0) {
      const { data } = await supabase
        .from("blogs")
        .select(baseSelect)
        .eq("is_published", true)
        .in("id", tagBlogIds)
        .order("created_at", { ascending: false })
        .limit(3 - results.length)
      for (const b of data ?? []) {
        if (!seen.has(b.id)) { seen.add(b.id); results.push(b as unknown as Blog) }
      }
    }
  }

  return results.slice(0, 3)
}

export interface BlogComment {
  id: string
  blog_id: string
  user_id: string
  content: string
  created_at: string
  profile: { first_name: string | null; last_name: string | null } | null
}

export async function getBlogComments(blogId: string): Promise<BlogComment[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("blog_comments")
    .select("id, blog_id, user_id, content, created_at, profile:profiles(first_name, last_name)")
    .eq("blog_id", blogId)
    .order("created_at", { ascending: false })
  if (error) throw dbError(error)
  return (data ?? []) as unknown as BlogComment[]
}

export async function getBlogEngagement(
  blogId: string
): Promise<{ likesCount: number; comments: BlogComment[] }> {
  const supabase = createAdminClient()
  const [countResult, commentsResult] = await Promise.all([
    supabase
      .from("blog_likes")
      .select("blog_id", { count: "exact", head: true })
      .eq("blog_id", blogId),
    supabase
      .from("blog_comments")
      .select("id, blog_id, user_id, content, created_at, profile:profiles(first_name, last_name)")
      .eq("blog_id", blogId)
      .order("created_at", { ascending: false }),
  ])
  return {
    likesCount: countResult.count ?? 0,
    comments: (commentsResult.data ?? []) as unknown as BlogComment[],
  }
}

export async function deleteComment(commentId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("blog_comments").delete().eq("id", commentId)
  if (error) throw dbError(error)
}

export async function addBlogComment(blogId: string, content: string): Promise<BlogComment> {
  const serverClient = await createClient()
  const { data: { user }, error: authError } = await serverClient.auth.getUser()
  if (authError || !user) throw new Error("Not authenticated")

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("blog_comments")
    .insert({ blog_id: blogId, user_id: user.id, content: content.trim() })
    .select("id, blog_id, user_id, content, created_at, profile:profiles(first_name, last_name)")
    .single()
  if (error) throw dbError(error)
  return data as unknown as BlogComment
}

export async function getBlogLikeData(
  blogId: string
): Promise<{ count: number; liked: boolean }> {
  const supabase = createAdminClient()
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()

  const [countResult, likedResult] = await Promise.all([
    supabase
      .from("blog_likes")
      .select("blog_id", { count: "exact", head: true })
      .eq("blog_id", blogId),
    user
      ? supabase
          .from("blog_likes")
          .select("blog_id")
          .eq("blog_id", blogId)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return {
    count: countResult.count ?? 0,
    liked: !!likedResult.data,
  }
}

export async function toggleBlogLike(blogId: string): Promise<{ liked: boolean; count: number }> {
  const serverClient = await createClient()
  const { data: { user }, error: authError } = await serverClient.auth.getUser()
  if (authError || !user) throw new Error("Not authenticated")

  const supabase = createAdminClient()

  const { data: existing, error: selectError } = await supabase
    .from("blog_likes")
    .select("blog_id")
    .eq("blog_id", blogId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (selectError) throw dbError(selectError)

  if (existing) {
    const { error: deleteError } = await supabase
      .from("blog_likes")
      .delete()
      .eq("blog_id", blogId)
      .eq("user_id", user.id)
    if (deleteError) throw dbError(deleteError)
  } else {
    const { error: insertError } = await supabase
      .from("blog_likes")
      .insert({ blog_id: blogId, user_id: user.id })
    if (insertError) throw dbError(insertError)
  }

  const { count, error: countError } = await supabase
    .from("blog_likes")
    .select("blog_id", { count: "exact", head: true })
    .eq("blog_id", blogId)
  if (countError) throw dbError(countError)

  return { liked: !existing, count: count ?? 0 }
}

export async function getBlogCountsMap(
  blogIds: string[]
): Promise<Map<string, { likes: number; comments: number }>> {
  if (blogIds.length === 0) return new Map()
  const supabase = createAdminClient()

  const [likesResult, commentsResult] = await Promise.all([
    supabase.from("blog_likes").select("blog_id").in("blog_id", blogIds),
    supabase.from("blog_comments").select("blog_id").in("blog_id", blogIds),
  ])

  const map = new Map<string, { likes: number; comments: number }>()
  for (const id of blogIds) map.set(id, { likes: 0, comments: 0 })

  for (const row of likesResult.data ?? []) {
    const entry = map.get(row.blog_id)
    if (entry) entry.likes++
  }
  for (const row of commentsResult.data ?? []) {
    const entry = map.get(row.blog_id)
    if (entry) entry.comments++
  }

  return map
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("blog_categories").select("*").order("name")
  if (error) throw dbError(error)
  return (data ?? []) as BlogCategory[]
}

export async function getBlogTags(): Promise<BlogTag[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("blog_tags").select("*").order("name")
  if (error) throw dbError(error)
  return (data ?? []) as BlogTag[]
}


export async function createBlog(values: BlogFormValues): Promise<Blog> {
  const serverClient = await createClient()
  const { data: { user }, error: authError } = await serverClient.auth.getUser()
  if (authError || !user) throw new Error("Not authenticated")

  const supabase = createAdminClient()
  const slug = await generateUniqueSlug(values.slug)
  const { data, error } = await supabase
    .from("blogs")
    .insert({
      title: values.title,
      slug,
      introduction: values.introduction ?? null,
      cover_image_path: values.cover_image_path ?? null,
      category_id: values.category_id || null,
      is_published: values.is_published,
      created_by: user.id,
    })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/blogs")
  return data as Blog
}

export async function updateBlog(id: string, values: BlogFormValues): Promise<Blog> {
  const supabase = createAdminClient()
  const slug = await generateUniqueSlug(values.slug, id)
  const { data, error } = await supabase
    .from("blogs")
    .update({
      title: values.title,
      slug,
      introduction: values.introduction ?? null,
      cover_image_path: values.cover_image_path ?? null,
      category_id: values.category_id || null,
      is_published: values.is_published,
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/blogs")
  return data as Blog
}

export async function deleteBlog(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("blogs").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/blogs")
}

export async function saveBlogBlocks(
  blogId: string,
  blocks: (Omit<BlogBlock, "id" | "blog_id" | "created_at"> & { layout?: string | null; column_position?: string | null })[]
): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from("blog_blocks").delete().eq("blog_id", blogId)
  if (blocks.length > 0) {
    const { error } = await supabase
      .from("blog_blocks")
      .insert(blocks.map((b) => ({ ...b, blog_id: blogId })))
    if (error) throw dbError(error)
  }
}

export async function saveBlogTags(blogId: string, tagIds: string[]): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from("blog_tag_relations").delete().eq("blog_id", blogId)
  if (tagIds.length > 0) {
    const { error } = await supabase
      .from("blog_tag_relations")
      .insert(tagIds.map((tag_id) => ({ blog_id: blogId, tag_id })))
    if (error) throw dbError(error)
  }
}
