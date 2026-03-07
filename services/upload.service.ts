import { createClient } from "@/lib/supabase/client"

export type StorageBucket =
  | "blog-images"
  | "mold-images"
  | "event-images"
  | "supplier-images"
  | "academy-thumbnails"
  | "ads-images"

export async function uploadImage(bucket: StorageBucket, file: File): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split(".").pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  })
  if (error) throw error

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return publicUrl
}

export async function deleteImage(bucket: StorageBucket, url: string): Promise<void> {
  const supabase = createClient()
  const path = url.split(`/${bucket}/`)[1]
  if (!path) return
  await supabase.storage.from(bucket).remove([path])
}
