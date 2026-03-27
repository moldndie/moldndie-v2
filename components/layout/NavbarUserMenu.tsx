"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, LayoutDashboard, ChevronDown, ShoppingBag } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import type { User } from "@supabase/supabase-js"

export default function NavbarUserMenu() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<"admin" | "user" | null>(null)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  async function fetchRole(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()
    setRole(data?.role ?? "user")
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchRole(user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        fetchRole(u.id)
      } else {
        setRole(null)
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  async function handleLogout() {
    await supabase.auth.signOut()
    setOpen(false)
    router.push("/")
    router.refresh()
  }

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Button className="rounded-full px-6 hover:opacity-90 cursor-pointer">
          <Link href="/login">Login</Link>
        </Button>
        <Link href="/signup" className="text-sm text-zinc-700 hover:text-zinc-900 transition-colors">
          Sign Up
        </Link>
      </div>
    )
  }

  const displayName = user.email ?? "User"
  const initial = displayName[0].toUpperCase()

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 cursor-pointer rounded-full pr-2 pl-1 py-1 hover:bg-zinc-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
          {initial}
        </div>
        <span className="text-sm text-zinc-700 max-w-[140px] truncate">{displayName}</span>
        <ChevronDown className={`size-3.5 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 bg-white shadow-md py-1 z-50">
          <Link
            href="/purchases"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <ShoppingBag className="size-4 text-zinc-400" />
            My Purchases
          </Link>
          {role === "admin" && (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <LayoutDashboard className="size-4 text-zinc-400" />
              Dashboard
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <LogOut className="size-4 text-zinc-400" />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
