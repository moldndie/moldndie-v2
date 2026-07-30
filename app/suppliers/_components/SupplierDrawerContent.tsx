"use client"

import Image from "next/image"
import { Building2, Globe, MapPin, MapPinned, Tag, AlertCircle } from "lucide-react"
import { useSupplierById } from "@/hooks/queries/useSuppliers"
import RichTextRenderer from "@/components/editor/RichTextRenderer"

const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? ""

function SkeletonDrawer() {
  return (
    <div className="animate-pulse">
      <div className="h-36 bg-zinc-200" />
      <div className="p-5 space-y-4">
        <div className="h-3 w-16 bg-zinc-200 rounded" />
        <div className="h-6 w-3/4 bg-zinc-200 rounded" />
        <div className="h-3 w-1/3 bg-zinc-100 rounded" />
        <div className="border-t border-zinc-100 pt-4 space-y-2">
          <div className="h-3 w-full bg-zinc-100 rounded" />
          <div className="h-3 w-5/6 bg-zinc-100 rounded" />
          <div className="h-3 w-4/6 bg-zinc-100 rounded" />
        </div>
      </div>
    </div>
  )
}

function DetailRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-zinc-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
        <div className="text-sm text-zinc-800">{children}</div>
      </div>
    </div>
  )
}

export function SupplierDrawerContent({ supplierId }: { supplierId: string }) {
  const { data: supplier, isLoading, isError } = useSupplierById(supplierId)

  if (isLoading) return <SkeletonDrawer />

  if (isError || !supplier) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <AlertCircle size={40} className="text-red-300 mb-3" strokeWidth={1} />
        <p className="text-zinc-700 font-semibold">Failed to load supplier</p>
        <p className="text-zinc-400 text-sm mt-1">Please try again later.</p>
      </div>
    )
  }

  const logoSrc = supplier.logo_path ? `${R2_BASE}/${supplier.logo_path}` : null

  return (
    <div>
      {/* Header banner */}
      <div className="relative bg-zinc-900 px-5 pt-6 pb-5 flex items-end gap-4">
        {/* Logo */}
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border-2 border-white/20 shrink-0 relative flex items-center justify-center shadow-md">
          {logoSrc ? (
            <Image src={logoSrc} alt={supplier.name} fill className="object-contain p-1.5" sizes="64px" />
          ) : (
            <Building2 size={28} className="text-zinc-400" strokeWidth={1} />
          )}
        </div>

        {/* Identity */}
        <div className="min-w-0 pb-1">
          {supplier.category && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">
              <Tag size={9} />
              {supplier.category.name}
            </span>
          )}
          <h3 className="text-base font-extrabold text-white leading-snug">{supplier.name}</h3>
          {supplier.country && (
            <div className="flex items-center gap-1.5 text-sm text-white/60 mt-0.5">
              <MapPin size={11} className="shrink-0" />
              {supplier.country}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {/* Description */}
        {supplier.description && (
          <div>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-2">About</p>
            <RichTextRenderer content={supplier.description} className="text-sm text-zinc-700" />
          </div>
        )}

        {/* Contact details */}
        {(supplier.website || supplier.address) && (
          <div className="space-y-4 pt-4 border-t border-zinc-100">
            {supplier.website && (
              <DetailRow icon={Globe} label="Website">
                <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                  {supplier.website.replace(/^https?:\/\//, "")}
                </a>
              </DetailRow>
            )}
            {supplier.address && (
              <DetailRow icon={MapPinned} label="Address">
                {supplier.address}
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
              className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white font-bold text-sm py-3 rounded-xl transition-colors"
            >
              <Globe size={15} />
              Visit Website
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
