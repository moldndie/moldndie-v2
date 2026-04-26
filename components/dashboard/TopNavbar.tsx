"use client"

import { Menu } from "lucide-react"
import { logoutAction } from "@/services/auth.service"

interface TopNavbarProps {
  user: {
    email?: string
    displayName?: string | null
  }
  onMenuClick: () => void
}

export default function TopNavbar({ user, onMenuClick }: TopNavbarProps) {
  const displayLabel = user.displayName || user.email || "User"
  const initials = displayLabel
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      <div className="ml-auto flex items-center gap-3">
        {/* User name / email */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-zinc-900">
            {user.displayName || user.email}
          </span>
          {user.displayName && (
            <span className="text-xs text-zinc-500">{user.email}</span>
          )}
        </div>

        {/* Avatar */}
        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white select-none">
          {initials}
        </div>

        {/* Logout */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 cursor-pointer"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  )
}
