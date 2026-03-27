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
  const ad = await getAdById(id).catch(() => null)
  if (!ad) notFound()

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Ad" description={`Editing: ${ad.title}`} />
      <AdForm ad={ad} />
    </div>
  )
}
