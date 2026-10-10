"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath, unstable_noStore as noStore } from "next/cache"
import { notFound } from "next/navigation"
import { parseDisabled } from "@/lib/modules"

export type SiteSettingKey =
  | "contact_phone"
  | "contact_email"
  | "contact_address"
  | "contact_maps_link"
  | "contact_hours"
  | "contact_whatsapp"
  | "social_facebook"
  | "social_instagram"
  | "social_youtube"
  | "social_pinterest"
  | "social_linkedin"
  | "social_twitter"
  | "hero_title"
  | "hero_subtitle"
  | "hero_description"
  | "footer_cta_text"
  | "footer_tagline"
  | "counter_blog"
  | "counter_toolings"
  | "counter_courses"
  | "counter_users"
  | "counter_events"
  | "offer_section_title"
  | "offer_section_subtitle"
  | "why_title"
  | "why_subtitle"
  | "why_body"
  | "join_title"
  | "join_description"
  | "logo_navbar"
  | "logo_footer"
  | "logo_favicon"
  | "hero_autoplay_seconds"
  | "ads_autoplay_seconds"
  | "disabled_modules"

export type SiteSettings = Partial<Record<SiteSettingKey, string>>

function dbError(e: unknown): Error {
  if (e && typeof e === "object" && "message" in e) {
    return new Error(String((e as { message: unknown }).message))
  }
  return new Error("Database error")
}

export async function getSiteSettings(): Promise<SiteSettings> {
  noStore()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("site_settings")
    .select("setting_key, setting_value")

  if (error) throw dbError(error)

  const result: SiteSettings = {}
  for (const row of data ?? []) {
    const v = row.setting_value
    result[row.setting_key as SiteSettingKey] = typeof v === "string" ? v : v != null ? String(v) : ""
  }
  return result
}

/** Module keys switched off in Site Content → Modules. Fails open: a settings outage must not take the site down. */
export async function getDisabledModules(): Promise<string[]> {
  try {
    return parseDisabled((await getSiteSettings()).disabled_modules)
  } catch {
    return []
  }
}

/** 404s the current route when the module is switched off. */
export async function requireModule(key: string): Promise<void> {
  if ((await getDisabledModules()).includes(key)) notFound()
}

export async function upsertSiteSetting(key: SiteSettingKey, value: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from("site_settings")
    .upsert({ setting_key: key, setting_value: value }, { onConflict: "setting_key" })

  if (error) throw dbError(error)
  revalidatePath("/")
  revalidatePath("/services")
  revalidatePath("/about")
}

export async function upsertSiteSettings(settings: SiteSettings): Promise<void> {
  const admin = createAdminClient()
  const rows = Object.entries(settings).map(([key, value]) => ({ setting_key: key, setting_value: value ?? "" }))
  if (rows.length === 0) return

  const { error } = await admin
    .from("site_settings")
    .upsert(rows, { onConflict: "setting_key" })

  if (error) throw dbError(error)

  revalidatePath("/", "layout")
}
