"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Building2,
  Globe,
  MapPin,
  MapPinned,
  AlertCircle,
  Tag,
  Phone,
  Mail,
} from "lucide-react"
import { useSupplierById } from "@/hooks/queries/useSuppliers"
import { PublicBreadcrumb } from "@/components/layout/PublicBreadcrumb"
import RichTextRenderer from "@/components/editor/RichTextRenderer"

const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

// ── Skeleton ──────────────────────────────────────────────────
function SkeletonDetail() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 animate-pulse">
      <div className="h-4 w-32 bg-zinc-200 rounded mb-8" />
      <div className="flex flex-col sm:flex-row gap-8 items-start">
        <div className="w-28 h-28 bg-zinc-200 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-3 w-20 bg-zinc-200 rounded" />
          <div className="h-8 w-2/3 bg-zinc-200 rounded" />
          <div className="h-3 w-28 bg-zinc-100 rounded" />
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-zinc-100 rounded w-full" />
            <div className="h-3 bg-zinc-100 rounded w-5/6" />
            <div className="h-3 bg-zinc-100 rounded w-4/6" />
          </div>
          <div className="h-11 w-40 bg-zinc-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ── Error ─────────────────────────────────────────────────────
function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-6">
      <AlertCircle size={48} className="text-red-300 mb-4" strokeWidth={1} />
      <p className="text-zinc-700 font-semibold text-lg">Something went wrong</p>
      <p className="text-zinc-400 text-sm mt-1">We couldn't load this supplier. Please try again.</p>
      <Link
        href="/suppliers"
        className="mt-6 text-sm text-primary no-underline underline-offset-2 hover:underline hover:opacity-70 transition-opacity"
      >
        Back to Suppliers
      </Link>
    </div>
  )
}

// ── Not found ─────────────────────────────────────────────────
function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-6">
      <Building2 size={48} className="text-zinc-200 mb-4" strokeWidth={1} />
      <p className="text-zinc-700 font-semibold text-lg">Supplier not found</p>
      <p className="text-zinc-400 text-sm mt-1">This supplier may have been removed or doesn't exist.</p>
      <Link
        href="/suppliers"
        className="mt-6 text-sm text-primary no-underline underline-offset-2 hover:underline hover:opacity-70 transition-opacity"
      >
        Back to Suppliers
      </Link>
    </div>
  )
}

// ── Detail row ────────────────────────────────────────────────
function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-zinc-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-0.5">{label}</p>
        <div className="text-sm text-zinc-800">{children}</div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function SupplierDetailClient({ supplierId }: { supplierId: string }) {
  const { data: supplier, isLoading, isError } = useSupplierById(supplierId)

  if (isLoading) return <SkeletonDetail />
  if (isError) return <ErrorState />
  if (!supplier) return <NotFoundState />

  const logoSrc = supplier.logo_path ? `${R2_BASE}/${supplier.logo_path}` : null

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* ── Breadcrumb ── */}
      <div className="mb-8">
        <PublicBreadcrumb crumbs={[{ label: "Suppliers", href: "/suppliers" }, { label: supplier.name }]} />
      </div>

      {/* ── Main card ── */}
      <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-6 items-start p-8 border-b border-zinc-100">
          {/* Logo */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 shrink-0 relative flex items-center justify-center">
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={supplier.name}
                fill
                className="object-contain p-2"
                sizes="96px"
                priority
              />
            ) : (
              <Building2 size={36} className="text-zinc-300" strokeWidth={1} />
            )}
          </div>

          {/* Identity */}
          <div className="space-y-2 flex-1 min-w-0">
            {supplier.category && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary uppercase tracking-widest">
                <Tag size={11} />
                {supplier.category.name}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 leading-tight">
              {supplier.name}
            </h1>
            {supplier.country && (
              <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                <MapPin size={14} className="shrink-0" />
                {supplier.country}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {/* Description */}
          {supplier.description && (
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-2">About</p>
              <RichTextRenderer content={supplier.description} className="text-sm text-zinc-700" />
            </div>
          )}

          {/* Detail rows */}
          {(supplier.website || supplier.address || supplier.phone || supplier.email) && (
            <div className="space-y-4 pt-2 border-t border-zinc-50">
              {supplier.website && (
                <DetailRow icon={Globe} label="Website">
                  <a
                    href={supplier.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {supplier.website.replace(/^https?:\/\//, "")}
                  </a>
                </DetailRow>
              )}
              {supplier.address && (
                <DetailRow icon={MapPinned} label="Address">
                  {supplier.address}
                </DetailRow>
              )}
              {supplier.phone && (
                <DetailRow icon={Phone} label="Phone">
                  <a href={`tel:${supplier.phone}`} className="text-primary hover:underline">
                    {supplier.phone}
                  </a>
                </DetailRow>
              )}
              {supplier.email && (
                <DetailRow icon={Mail} label="Email">
                  <a href={`mailto:${supplier.email}`} className="text-primary hover:underline break-all">
                    {supplier.email}
                  </a>
                </DetailRow>
              )}
            </div>
          )}

          {/* CTA */}
          {supplier.website && (
            <div className="pt-2">
              <a
                href={supplier.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
              >
                <Globe size={16} />
                Visit Website
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
