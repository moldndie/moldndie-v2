import { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
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
        {/* Hero */}
        <section className="bg-zinc-950 text-white py-12 px-6">
          <div className="max-w-5xl mx-auto">
            <PublicBreadcrumb crumbs={[
              { label: "Engineering Tools", href: "/tools" },
              { label: calc.title },
            ]} />
            <div className="mt-4">
              {calc.category && (
                <span className="inline-block rounded-full bg-primary/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-primary mb-3">
                  {calc.category.name}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">{calc.title}</h1>
              {calc.short_description && (
                <p className="mt-2 text-sm text-zinc-400 max-w-xl">{calc.short_description}</p>
              )}
            </div>
          </div>
        </section>

        {/* Calculator */}
        <section className="max-w-5xl mx-auto px-6 py-12">
          <CalculatorRunner calculator={calc} />

          {/* Description */}
          {calc.description && (
            <div className="mt-10 rounded-xl border border-zinc-200 bg-white p-6">
              <h2 className="text-base font-bold text-zinc-900 mb-3">About This Calculator</h2>
              <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">{calc.description}</p>
            </div>
          )}

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-10">
              <h2 className="text-base font-bold text-zinc-900 mb-4">Related Calculators</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map((r) => (
                  <a
                    key={r.id}
                    href={`/tools/${r.slug}`}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-primary hover:shadow-sm transition-all"
                  >
                    <p className="text-sm font-semibold text-zinc-900">{r.title}</p>
                    {r.short_description && (
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{r.short_description}</p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
        <div className="max-w-5xl mx-auto px-6 pb-12">
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
