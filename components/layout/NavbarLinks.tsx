"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navLinks = [
  { label: "Blog",      href: "/blogs" },
  { label: "Library",   href: "/molds" },
  { label: "Academy",   href: "/courses" },
  { label: "Events",    href: "/events" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "Services",  href: "/services" },
]

export default function NavbarLinks() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex items-center gap-8">
      {navLinks.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm transition-colors ${
              isActive
                ? "text-primary font-semibold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
