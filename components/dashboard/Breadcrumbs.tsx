"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"

const labelMap: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  blogs: "Blog",
  molds: "Library",
  courses: "Academy",
  events: "Events",
  suppliers: "Suppliers",
  ads: "Ads",
  users: "Users",
  "service-requests": "Services",
  "site-content": "Site Content",
  create: "Create",
  edit: "Edit",
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/")
    const label = labelMap[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1)
    const isLast = i === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-zinc-500">
      {crumbs.map(({ href, label, isLast }) => (
        <span key={href} className="flex items-center gap-1">
          {isLast ? (
            <span className="font-medium text-zinc-900">{label}</span>
          ) : (
            <>
              <Link href={href} className="hover:text-zinc-700 transition-colors">
                {label}
              </Link>
              <ChevronRight className="size-3.5" />
            </>
          )}
        </span>
      ))}
    </nav>
  )
}
