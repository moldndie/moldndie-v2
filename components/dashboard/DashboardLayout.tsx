"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import TopNavbar from "./TopNavbar"
import Breadcrumbs from "./Breadcrumbs"

interface DashboardLayoutProps {
  user: {
    email?: string
    displayName?: string | null
  }
  children: React.ReactNode
}

export default function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <TopNavbar user={user} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          {/* Breadcrumbs bar */}
          <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-2.5 lg:px-6">
            <Breadcrumbs />
          </div>

          {/* Page content */}
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
