import type { Metadata } from "next"
import { notFound } from "next/navigation"
import PageHeader from "@/components/dashboard/PageHeader"
import WhyCardForm from "../WhyCardForm"
import { getWhyCardById } from "@/services/homeWhyCards.service"

export const metadata: Metadata = { title: "Edit Why Card | Admin" }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditWhyCardPage({ params }: Props) {
  const { id } = await params
  const card = await getWhyCardById(id).catch(() => null)
  if (!card) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit: ${card.title}`}
        description="Update the card content, icon, and visibility."
      />
      <WhyCardForm card={card} />
    </div>
  )
}
