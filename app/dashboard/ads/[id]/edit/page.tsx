import { Metadata } from "next"
import { notFound } from "next/navigation"
import PageHeader from "@/components/dashboard/PageHeader"
import { AdForm } from "@/modules/ad/components/AdForm"
import { getAdById } from "@/services/ad.service"

interface Props {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { title: "Edit Ad | Admin" }

export default async function EditAdPage({ params }: Props) {
  const { id } = await params
  const raw = await getAdById(id).catch(() => null)
  if (!raw) notFound()

  // Sanitize for safe server→client serialization (undefined → null)
  const ad = {
    id:           String(raw.id ?? ""),
    title:        String(raw.title ?? ""),
    image_path:   String(raw.image_path ?? ""),
    link:         String(raw.link ?? ""),
    target_pages: Array.isArray(raw.target_pages) ? raw.target_pages : [],
    is_active:    Boolean(raw.is_active),
    starts_at:    raw.starts_at ?? null,
    ends_at:      raw.ends_at ?? null,
    created_at:   String(raw.created_at ?? ""),
    updated_at:   raw.updated_at ? String(raw.updated_at) : String(raw.created_at ?? ""),
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Ad" description={`Editing: ${ad.title}`} />
      <AdForm ad={ad} />
    </div>
  )
}
