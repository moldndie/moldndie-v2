import type { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import OfferItemForm from "../OfferItemForm"

export const metadata: Metadata = { title: "New Offer Card | Admin" }

export default function NewOfferItemPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Offer Card"
        description="Add a new card to the What We Offer section on the homepage."
      />
      <OfferItemForm />
    </div>
  )
}
