"use client"

import Link from "next/link"
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
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Blogs", href: "/dashboard/blogs", icon: FileText },
  { label: "Toolings", href: "/dashboard/molds", icon: Package },
  { label: "Academy", href: "/dashboard/courses", icon: BookOpen },
  { label: "Events", href: "/dashboard/events", icon: Calendar },
  { label: "Suppliers", href: "/dashboard/suppliers", icon: Truck },
  { label: "Ads", href: "/dashboard/ads", icon: Megaphone },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Services", href: "/dashboard/service-requests", icon: Inbox },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white border-r border-zinc-200 transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-200 shrink-0">
          <span className="text-lg font-bold tracking-tight text-zinc-900">Moldndie</span>
          <button
            onClick={onClose}
            className="lg:hidden rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
