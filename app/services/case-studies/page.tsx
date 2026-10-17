import type { Metadata } from "next"
import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import PortfolioSection from "../PortfolioSection"
import { getActiveServices } from "@/services/service.service"
import { getActivePortfolioItems } from "@/services/portfolio.service"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Case Studies | MoldNdie",
  description: "Real tooling projects delivered by the MoldNdie engineering team.",
}

interface Props {
  searchParams: Promise<{ service?: string }>
}

export default async function CaseStudiesPage({ searchParams }: Props) {
  const { service: slug } = await searchParams
  const [all, services] = await Promise.all([
    getActivePortfolioItems().catch(() => []),
    getActiveServices().catch(() => []),
  ])

  const names = Object.fromEntries(services.map((s) => [s.id, s.title]))
  // The service filter only lists services that actually have case studies.
  const filters = services.filter((s) => all.some((i) => i.service_id === s.id))
  const active = filters.find((s) => s.slug === slug)
  const items = active ? all.filter((i) => i.service_id === active.id) : all

  const chip = (on: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors",
      on ? "border-primary bg-primary text-white" : "border-zinc-200 text-zinc-600 hover:border-primary hover:text-primary",
    )

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
          <div>
            <PublicBreadcrumb crumbs={[{ label: "Services", href: "/services" }, { label: "Case Studies" }]} />
            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight">
              Case Studies
            </h1>
          </div>
          {filters.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <Link href="/services/case-studies" className={chip(!active)}>All</Link>
              {filters.map((s) => (
                <Link key={s.id} href={`/services/case-studies?service=${s.slug}`} className={chip(active?.id === s.id)}>
                  {s.title}
                </Link>
              ))}
            </div>
          )}
        </div>
        {items.length > 0 ? (
          <PortfolioSection items={items} services={names} heading={null} />
        ) : (
          <p className="max-w-7xl mx-auto px-6 pb-16 text-sm text-zinc-500">No case studies yet.</p>
        )}
      </main>
      <Footer />
    </div>
  )
}
