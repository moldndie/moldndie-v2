import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import RichTextRenderer from "@/components/editor/RichTextRenderer"
import MediaGallery from "@/components/services/MediaGallery"
import { getActiveServices } from "@/services/service.service"
import { getActivePortfolioItems } from "@/services/portfolio.service"
import { docToText } from "@/lib/richtext"

interface Props {
  params: Promise<{ id: string }>
}

async function load(id: string) {
  const all = await getActivePortfolioItems().catch(() => [])
  const i = all.findIndex((x) => x.id === id)
  return { all, i }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { all, i } = await load(id)
  if (i < 0) return { title: "Case Study | MoldNdie" }
  return {
    title: `${all[i].title} | MoldNdie`,
    description: docToText(all[i].description).slice(0, 160),
  }
}

export default async function CaseStudyPage({ params }: Props) {
  const { id } = await params
  const { all, i } = await load(id)
  if (i < 0) notFound()

  const item = all[i]
  const prev = all[i - 1]
  const next = all[i + 1]
  const service = item.service_id
    ? (await getActiveServices().catch(() => [])).find((s) => s.id === item.service_id)
    : undefined

  const navLink = "inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
          <div>
            <PublicBreadcrumb
              crumbs={[
                { label: "Services", href: "/services" },
                { label: "Case Studies", href: "/services/case-studies" },
                { label: item.title },
              ]}
            />
            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">
              {item.title}
            </h1>
            {service && (
              <Link
                href={`/services/${service.slug}`}
                className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/20"
              >
                {service.title}
              </Link>
            )}
          </div>

          <MediaGallery
            title={item.title}
            images={item.images}
            videos={item.video_paths}
            videoUrls={item.video_urls}
          />

          {item.description && (
            <RichTextRenderer content={item.description} className="text-sm text-zinc-600" />
          )}

          <nav className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-6">
            {prev ? (
              <Link href={`/services/case-studies/${prev.id}`} className={navLink}>
                <ArrowLeft size={14} /> {prev.title}
              </Link>
            ) : <span />}
            <span className="flex gap-4 text-sm font-medium text-zinc-500">
              <Link href="/services/case-studies" className="hover:text-primary">All case studies</Link>
              <Link href="/services" className="hover:text-primary">Back to services</Link>
            </span>
            {next ? (
              <Link href={`/services/case-studies/${next.id}`} className={navLink}>
                {next.title} <ArrowRight size={14} />
              </Link>
            ) : <span />}
          </nav>
        </div>
      </main>
      <Footer />
    </div>
  )
}
