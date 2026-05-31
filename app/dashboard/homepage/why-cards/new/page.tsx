import type { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import WhyCardForm from "../WhyCardForm"

export const metadata: Metadata = { title: "New Why Card | Admin" }

export default function NewWhyCardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Why Card"
        description="Add a card to the Why Choose Us section on the homepage."
      />
      <WhyCardForm />
    </div>
  )
}
