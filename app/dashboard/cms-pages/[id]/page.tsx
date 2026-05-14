import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCmsPageById } from "@/services/cmsPage.service"
import PageHeader from "@/components/dashboard/PageHeader"
import CmsPageEditClient from "./CmsPageEditClient"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const metadata: Metadata = { title: "Edit CMS Page | Admin" }

interface Props {
  params: Promise<{ id: string }>
}

export default async function CmsPageEditPage({ params }: Props) {
  const { id } = await params
  const page = await getCmsPageById(id)
  if (!page) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/cms-pages"
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ChevronLeft className="size-3.5" />
          CMS Pages
        </Link>
      </div>
      <PageHeader
        title={page.title}
        description={`Editing /${page.slug} — use the rich editor to update content, then save or publish.`}
      />
      <CmsPageEditClient page={page} />
    </div>
  )
}
