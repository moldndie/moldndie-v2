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

export async function getBlogs(): Promise<Blog[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blogs")
    .select("*, category:blog_categories(id,name,slug,created_at)")
    .order("created_at", { ascending: false })
  if (error) throw dbError(error)
  return (data ?? []) as Blog[]
}

export async function getBlogById(id: string): Promise<Blog> {
  const supabase = await createClient()
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
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blogs")
    .insert({
      title: values.title,
      slug: values.slug,
      excerpt: values.excerpt ?? null,
      cover_image: values.cover_image ?? null,
      category_id: values.category_id || null,
      published: values.published,
    })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/blogs")
  return data as Blog
}

export async function updateBlog(id: string, values: BlogFormValues): Promise<Blog> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blogs")
    .update({
      title: values.title,
      slug: values.slug,
      excerpt: values.excerpt ?? null,
      cover_image: values.cover_image ?? null,
      category_id: values.category_id || null,
      published: values.published,
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/blogs")
  return data as Blog
}

export async function deleteBlog(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("blogs").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/blogs")
}

export async function saveBlogBlocks(
  blogId: string,
  blocks: Omit<BlogBlock, "id" | "blog_id" | "created_at">[]
): Promise<void> {
  const supabase = await createClient()
  await supabase.from("blog_blocks").delete().eq("blog_id", blogId)
  if (blocks.length > 0) {
    const { error } = await supabase
      .from("blog_blocks")
      .insert(blocks.map((b) => ({ ...b, blog_id: blogId })))
    if (error) throw dbError(error)
  }
}

export async function saveBlogTags(blogId: string, tagIds: string[]): Promise<void> {
  const supabase = await createClient()
  await supabase.from("blog_tag_relations").delete().eq("blog_id", blogId)
  if (tagIds.length > 0) {
    const { error } = await supabase
      .from("blog_tag_relations")
      .insert(tagIds.map((tag_id) => ({ blog_id: blogId, tag_id })))
    if (error) throw dbError(error)
  }
}
