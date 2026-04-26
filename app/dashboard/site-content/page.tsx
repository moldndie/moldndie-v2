import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { getSiteSettings } from "@/services/siteSettings.service"
import SiteContentClient from "./SiteContentClient"

export const metadata: Metadata = { title: "Site Content | Admin" }

export default async function SiteContentPage() {
  let settings = {}
  try {
    settings = await getSiteSettings()
  } catch {
    // site_settings table may not exist yet — show empty form
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Content"
        description="Edit website content, contact info, and social links. Changes go live immediately."
      />
      <SiteContentClient initialSettings={settings} />
    </div>
  )
}
