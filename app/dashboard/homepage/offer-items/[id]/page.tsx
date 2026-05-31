import type { Metadata } from "next"
import { notFound } from "next/navigation"
import PageHeader from "@/components/dashboard/PageHeader"
import OfferItemForm from "../OfferItemForm"
import { getOfferItemById } from "@/services/homeOfferItems.service"

export const metadata: Metadata = { title: "Edit Offer Card | Admin" }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditOfferItemPage({ params }: Props) {
  const { id } = await params
  const item = await getOfferItemById(id).catch(() => null)
  if (!item) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit: ${item.title}`}
        description="Update the card content, icon, link, and visibility."
      />
      <OfferItemForm item={item} />
    </div>
  )
}
