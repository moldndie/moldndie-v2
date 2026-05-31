"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Package,
  BookOpen,
  Calendar,
  Truck,
  Megaphone,
  Users,
  Inbox,
  Settings2,
  Calculator,
  Briefcase,
  LayoutPanelTop,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavChild {
  label: string
  href: string
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  exact?: boolean
  children?: NavChild[]
}

const navItems: NavItem[] = [
  { label: "Dashboard",        href: "/dashboard",                   icon: LayoutDashboard, exact: true },
  { label: "Blog",             href: "/dashboard/blogs",             icon: FileText },
  { label: "Library",          href: "/dashboard/molds",             icon: Package },
  { label: "Academy",          href: "/dashboard/courses",           icon: BookOpen },
  { label: "Events",           href: "/dashboard/events",            icon: Calendar },
  { label: "Suppliers",        href: "/dashboard/suppliers",         icon: Truck },
  { label: "Ads",              href: "/dashboard/ads",               icon: Megaphone },
  { label: "Users",            href: "/dashboard/users",             icon: Users },
  { label: "Service Requests", href: "/dashboard/service-requests",  icon: Inbox },
  { label: "Services",         href: "/dashboard/services",          icon: Briefcase },
  { label: "Calculators",      href: "/dashboard/calculators",       icon: Calculator },
  {
    label: "Homepage",
    href: "/dashboard/homepage/hero-carousel",
    icon: LayoutPanelTop,
    children: [
      { label: "Hero Carousel",   href: "/dashboard/homepage/hero-carousel" },
      { label: "What We Offer",   href: "/dashboard/homepage/offer-items" },
      { label: "Why Choose Us",   href: "/dashboard/homepage/why-cards" },
    ],
  },
  {
    label: "Site Content",
    href: "/dashboard/site-content",
    icon: Settings2,
    children: [
      { label: "General Settings", href: "/dashboard/site-content" },
      { label: "CMS Pages",        href: "/dashboard/cms-pages" },
    ],
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    return exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/")
  }

  function isSectionActive(item: NavItem) {
    if (item.children) {
      return item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"))
    }
    return isActive(item.href, item.exact)
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white border-r border-zinc-200 transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-200 shrink-0">
          <Image src="/assets/logo-black-updated.png" alt="Mold N Die" width={100} height={32} className="h-8 w-auto" />
          <button
            onClick={onClose}
            className="lg:hidden rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const sectionActive = isSectionActive(item)
            const Icon = item.icon

            if (item.children) {
              return (
                <div key={item.href}>
                  {/* Parent row — links to first child (Courses) */}
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      sectionActive
                        ? "bg-primary text-primary-foreground"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                  {/* Sub-items — always visible when section is active */}
                  {sectionActive && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-zinc-200 pl-3">
                      {item.children.map((child) => {
                        const childActive =
                          child.href === item.href
                            ? pathname === child.href
                            : pathname === child.href || pathname.startsWith(child.href + "/")
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-center rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                              childActive
                                ? "bg-primary/10 text-primary"
                                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                            )}
                          >
                            {child.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href, item.exact)
                    ? "bg-primary text-primary-foreground"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
