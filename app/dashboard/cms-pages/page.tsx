import type { Metadata } from "next"
import Link from "next/link"
import { getCmsPages, type CmsPage } from "@/services/cmsPage.service"
import PageHeader from "@/components/dashboard/PageHeader"
import { FileText, Pencil, Globe, EyeOff } from "lucide-react"

export const metadata: Metadata = { title: "CMS Pages | Admin" }

export default async function CmsPagesPage() {
  let pages: CmsPage[] = []
  try {
    pages = await getCmsPages()
  } catch {
    // table may not be seeded yet
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="CMS Pages"
        description="Manage legal and static pages. Changes go live after publishing."
      />

      {pages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-12 text-center">
          <FileText className="mx-auto mb-3 size-8 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-500">No CMS pages found.</p>
          <p className="mt-1 text-xs text-zinc-400">
            Seed the database with the initial pages migration to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-5 py-3 text-left font-semibold text-zinc-500">Page</th>
                <th className="px-5 py-3 text-left font-semibold text-zinc-500">URL</th>
                <th className="px-5 py-3 text-left font-semibold text-zinc-500">Status</th>
                <th className="px-5 py-3 text-right font-semibold text-zinc-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-medium text-zinc-900">{page.title}</span>
                    {page.seo_description && (
                      <p className="mt-0.5 text-xs text-zinc-400 line-clamp-1">{page.seo_description}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={`/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Globe className="size-3" />/{page.slug}
                    </a>
                  </td>
                  <td className="px-5 py-4">
                    {page.is_published ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
                        <EyeOff className="size-3" />
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/dashboard/cms-pages/${page.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
                    >
                      <Pencil className="size-3" />
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
