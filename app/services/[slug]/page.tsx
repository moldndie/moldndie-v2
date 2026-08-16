import type { Metadata } from "next"
import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CheckCircle, FolderKanban } from "lucide-react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import RichTextRenderer from "@/components/editor/RichTextRenderer"
import PortfolioSection from "../PortfolioSection"
import { getActiveServiceBySlug } from "@/services/service.service"
import { getPortfolioItemsForService } from "@/services/portfolio.service"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"
import { docToText } from "@/lib/richtext"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = await getActiveServiceBySlug(slug).catch(() => null)
  if (!service) return { title: "Service | MoldNdie" }
  return {
    title: `${service.title} | MoldNdie`,
    // Flattened, not raw — the column holds a Tiptap JSON blob.
    description: service.tagline ?? docToText(service.description).slice(0, 160),
  }
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params
  const service = await getActiveServiceBySlug(slug).catch(() => null)
  if (!service) notFound()

  const portfolio = await getPortfolioItemsForService(service.id).catch(() => [])
  // Blank entries in the repeater would otherwise render as a bare tick icon.
  const highlights = (service.highlights ?? []).filter((h) => h.trim())

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          <div>
            <PublicBreadcrumb
              crumbs={[{ label: "Services", href: "/services" }, { label: service.title }]}
            />
            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">
              {service.title}
            </h1>
            {service.tagline && (
              <span className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                {service.tagline}
              </span>
            )}
            {service.is_egypt_only && (
              <p className="mt-3 inline-block rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-800">
                Currently available in Egypt only.
              </p>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-zinc-100 bg-white">
              {service.image ? (
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-50">
                  <FolderKanban size={72} className="text-primary/20" strokeWidth={0.8} />
                </div>
              )}
            </div>

            <div className="space-y-5">
              {service.description && (
                <RichTextRenderer content={service.description} className="text-sm text-zinc-600" />
              )}
              {highlights.length > 0 && (
                <ul className="space-y-2">
                  {highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-zinc-600">
                      <CheckCircle size={14} className="text-primary mt-0.5 shrink-0" strokeWidth={2} />
                      {h}
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/services#request-form"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
              >
                Request This Service
              </Link>
            </div>
          </div>
        </div>

        <PortfolioSection items={portfolio} heading="Examples" />

        <div className="max-w-7xl mx-auto px-6 pb-12">
          <hr className="border-zinc-100 mb-8" />
          <Suspense fallback={null}>
            <AdSlotGrid page="services" className="w-full" />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
