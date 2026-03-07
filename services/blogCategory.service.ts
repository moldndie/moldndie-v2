"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { BlogCategory } from "@/types"
import type { BlogCategoryFormValues } from "@/schemas/blogCategory.schema"

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

export async function getCategories(): Promise<BlogCategory[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("blog_categories")
    .select("*")
    .order("name")
  if (error) throw dbError(error)
  return (data ?? []) as BlogCategory[]
}

export async function createCategory(values: BlogCategoryFormValues): Promise<BlogCategory> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("blog_categories")
    .insert({ name: values.name, slug: values.slug })
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/blogs")
  return data as BlogCategory
}

export async function updateCategory(
  id: string,
  values: BlogCategoryFormValues
): Promise<BlogCategory> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("blog_categories")
    .update({ name: values.name, slug: values.slug })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/blogs")
  return data as BlogCategory
}

export async function deleteCategory(id: string): Promise<void> {
  const admin = createAdminClient()

  const { count, error: countError } = await admin
    .from("blogs")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id)

  if (countError) throw dbError(countError)
  if (count && count > 0) {
    throw new Error(
      `Cannot delete: ${count} blog post${count > 1 ? "s are" : " is"} using this category.`
    )
  }

  const { error } = await admin.from("blog_categories").delete().eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/blogs")
}
