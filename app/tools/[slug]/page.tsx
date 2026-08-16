import { Metadata } from "next"
import { Suspense } from "react"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getFileUrl } from "@/lib/utils"
import RichTextRenderer from "@/components/editor/RichTextRenderer"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { ContentViewTracker } from "@/components/analytics/ContentViewTracker"
import { getCalculatorBySlug, getCalculators } from "@/services/calculator.service"
import CalculatorRunner from "./CalculatorRunner"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import { AdSlotGrid } from "@/components/ads/AdSlotGrid"

export async function generateStaticParams() {
  const calcs = await getCalculators({ published: true }).catch(() => [])
  return calcs.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const calc = await getCalculatorBySlug(slug).catch(() => null)
  if (!calc) return { title: "Calculator Not Found" }
  return {
    title: calc.seo_title ?? `${calc.title} | MoldNDie Tools`,
    description: calc.seo_description ?? calc.short_description ?? undefined,
  }
}

export default async function CalculatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const calc = await getCalculatorBySlug(slug)
  if (!calc || !calc.is_published) notFound()

  // Related calculators (same category, excluding self)
  const related = calc.category_id
    ? await getCalculators({ published: true, categoryId: calc.category_id })
        .then((r) => r.filter((c) => c.id !== calc.id).slice(0, 3))
        .catch(() => [])
    : []

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <ContentViewTracker contentType="calculator" contentId={calc.id} />
        {/* Header */}
        <section className="max-w-7xl mx-auto px-6 pt-10">
          <PublicBreadcrumb crumbs={[
            { label: "Engineering", href: "/tools" },
            { label: calc.title },
          ]} />
          {calc.category && (
            <span className="mt-3 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              {calc.category.name}
            </span>
          )}
          <h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">
            {calc.title}
          </h1>
          {calc.short_description && (
            <p className="mt-1 text-sm text-zinc-500 max-w-2xl">{calc.short_description}</p>
          )}
        </section>

        {/* Calculator */}
        <section className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          {/* `images` is the current field; `cover_image` covers rows saved before it existed. */}
          {(() => {
            const images = calc.images?.length ? calc.images : calc.cover_image ? [calc.cover_image] : []
            if (images.length === 0) return null
            return (
              <div
                className={
                  images.length === 1
                    ? "mx-auto max-w-3xl"
                    : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                }
              >
                {images.map((key) => (
                  <div
                    key={key}
                    className="relative aspect-video w-full overflow-hidden rounded-2xl border border-zinc-100 bg-white"
                  >
                    <Image
                      src={getFileUrl(key)}
                      alt={calc.title}
                      fill
                      className="object-contain"
                      sizes={images.length === 1 ? "(max-width: 768px) 100vw, 768px" : "(max-width: 640px) 100vw, 33vw"}
                    />
                  </div>
                ))}
              </div>
            )
          })()}

          {/* The tool is a single dark card on the white page — a deep tint of
              the brand maroon, not a neutral black. Tokens live in globals.css
              under --calc-*. */}
          <div className="overflow-hidden rounded-3xl bg-[var(--calc-surface)] shadow-2xl shadow-zinc-900/10 ring-1 ring-black/5">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--calc-accent)] to-transparent opacity-70" />
            <div className="p-6 sm:p-8">
              <CalculatorRunner calculator={calc} theme="dark" />
            </div>
          </div>

          {/* Description */}
          {calc.description && (
            <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wide mb-3">
                About This Calculator
              </h2>
              <RichTextRenderer content={calc.description} className="text-sm text-zinc-600" />
            </div>
          )}

          {/* Related */}
          {related.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wide mb-4">
                Related Tools
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map((r) => (
                  <a
                    key={r.id}
                    href={`/tools/${r.slug}`}
                    className="group rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <p className="text-sm font-bold text-zinc-900 group-hover:text-primary transition-colors">
                      {r.title}
                    </p>
                    {r.short_description && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{r.short_description}</p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <hr className="border-zinc-100 mb-8" />
          <Suspense fallback={null}>
            <AdSlotGrid page="engineering" className="w-full" />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
