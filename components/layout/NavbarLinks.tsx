"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { SiteModule } from "@/lib/modules"

export default function NavbarLinks({ links }: { links: SiteModule[] }) {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex items-center gap-8">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm transition-colors ${
              isActive
                ? "text-primary font-semibold"
                : "text-zinc-600 hover:text-primary"
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
