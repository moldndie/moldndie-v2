"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { BlogTag } from "@/types"
import type { BlogTagFormValues } from "@/schemas/blogTag.schema"

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

export async function getTags(): Promise<BlogTag[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("blog_tags")
    .select("*")
    .order("name")
  if (error) throw dbError(error)
  return (data ?? []) as BlogTag[]
}

export async function createTag(values: BlogTagFormValues): Promise<BlogTag> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("blog_tags")
    .insert({ name: values.name, slug: values.slug })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/blogs")
  return data as BlogTag
}

export async function updateTag(id: string, values: BlogTagFormValues): Promise<BlogTag> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("blog_tags")
    .update({ name: values.name, slug: values.slug })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/blogs")
  return data as BlogTag
}

export async function deleteTag(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from("blog_tags").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/blogs")
}
