import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { getCmsPageBySlug } from "@/services/cmsPage.service"
import RichTextRenderer from "@/components/editor/RichTextRenderer"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPageBySlug("refund-policy")
  return {
    title: page?.seo_title || page?.title || "Refund Policy",
    description: page?.seo_description || undefined,
  }
}

export default async function RefundPolicyPage() {
  const page = await getCmsPageBySlug("refund-policy")

  if (!page || !page.is_published) notFound()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <h1 className="text-3xl font-extrabold text-zinc-900 mb-10">{page.title}</h1>
          <RichTextRenderer content={page.content} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
