"use client"

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface Crumb {
  label: string
  href?: string
}

interface PublicBreadcrumbProps {
  crumbs: Crumb[]
}

export function PublicBreadcrumb({ crumbs }: PublicBreadcrumbProps) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...crumbs]

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 flex-wrap text-sm text-zinc-400">
      {all.map((crumb, i) => {
        const isLast = i === all.length - 1
        return (
          <span key={i} className="flex items-center gap-1">
            {isLast ? (
              <span className="font-medium text-zinc-700 line-clamp-1 max-w-50 sm:max-w-xs">
                {i === 0 ? <Home className="size-3.5 inline-block" /> : crumb.label}
              </span>
            ) : (
              <>
                <Link
                  href={crumb.href ?? "/"}
                  className="hover:text-zinc-600 transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  {i === 0 ? <Home className="size-3.5" /> : crumb.label}
                </Link>
                <ChevronRight className="size-3.5 shrink-0" />
              </>
            )}
          </span>
        )
      })}
    </nav>
  )
}
