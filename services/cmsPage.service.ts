"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { CmsPageFormValues } from "@/schemas/cmsPage.schema"

export interface CmsPage {
  id: string
  slug: string
  title: string
  content: Record<string, unknown> | null
  seo_title: string | null
  seo_description: string | null
  is_published: boolean
  created_at: string
  updated_at: string | null
}

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

export async function getCmsPages(): Promise<CmsPage[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("cms_pages")
    .select("*")
    .order("slug", { ascending: true })
  if (error) throw dbError(error)
  return (data ?? []) as CmsPage[]
}

export async function getCmsPageById(id: string): Promise<CmsPage | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw dbError(error)
  return data as CmsPage | null
}

export async function getCmsPageBySlug(slug: string): Promise<CmsPage | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()
  if (error) throw dbError(error)
  return data as CmsPage | null
}

export async function upsertCmsPage(values: CmsPageFormValues): Promise<CmsPage> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("cms_pages")
    .upsert(
      {
        slug: values.slug,
        title: values.title,
        content: values.content ?? null,
        seo_title: values.seo_title || null,
        seo_description: values.seo_description || null,
        is_published: values.is_published,
      },
      { onConflict: "slug" }
    )
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/cms-pages")
  revalidatePath(`/${values.slug}`)
  return data as CmsPage
}

export async function updateCmsPage(id: string, values: CmsPageFormValues): Promise<CmsPage> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("cms_pages")
    .update({
      title: values.title,
      slug: values.slug,
      content: values.content ?? null,
      seo_title: values.seo_title || null,
      seo_description: values.seo_description || null,
      is_published: values.is_published,
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw dbError(error)
  revalidatePath("/dashboard/cms-pages")
  revalidatePath(`/${values.slug}`)
  revalidatePath("/privacy-policy")
  revalidatePath("/terms-of-use")
  revalidatePath("/refund-policy")
  return data as CmsPage
}

export async function setCmsPagePublished(id: string, published: boolean, slug?: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("cms_pages")
    .update({ is_published: published })
    .eq("id", id)
  if (error) throw dbError(error)
  revalidatePath("/dashboard/cms-pages")
  // Revalidate the public-facing URL so the page reflects published state immediately.
  if (slug) revalidatePath(`/${slug}`)
  revalidatePath("/privacy-policy")
  revalidatePath("/terms-of-use")
  revalidatePath("/refund-policy")
}
