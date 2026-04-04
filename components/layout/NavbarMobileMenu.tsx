"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

const navLinks = [
  { label: "Blog",      href: "/blogs" },
  { label: "Library",   href: "/molds" },
  { label: "Academy",   href: "/courses" },
  { label: "Events",    href: "/events" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "Services",  href: "/services" },
]

export default function NavbarMobileMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 text-zinc-600 hover:text-zinc-900 transition-colors"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-16 z-40 bg-white border-b border-zinc-100 shadow-sm px-6 py-4 flex flex-col gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`py-2.5 text-sm transition-colors border-b border-zinc-50 last:border-0 ${
                  isActive ? "text-primary font-semibold" : "text-zinc-700 hover:text-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
