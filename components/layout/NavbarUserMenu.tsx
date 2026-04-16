"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, LayoutDashboard, ChevronDown, ShoppingBag, GraduationCap, ShoppingCart, UserCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/queries/useCart"
import type { User } from "@supabase/supabase-js"

function CartButton() {
  const { data: items = [] } = useCart()
  const count = items.length

  return (
    <Link
      href="/cart"
      className="relative p-2 text-zinc-600 hover:text-zinc-900 transition-colors"
      aria-label="Cart"
    >
      <ShoppingCart size={20} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 flex items-center justify-center bg-primary text-white text-[10px] font-bold rounded-full px-1 leading-none">
          {count}
        </span>
      )}
    </Link>
  )
}

export default function NavbarUserMenu() {
  const router = useRouter()
  const supabase = createClient()

  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<"admin" | "user" | null>(null)
  const [firstName, setFirstName] = useState<string | null>(null)
  const [lastName, setLastName] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("role, first_name, last_name")
      .eq("id", userId)
      .single()
    setRole(data?.role ?? "user")
    setFirstName(data?.first_name ?? null)
    setLastName(data?.last_name ?? null)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchProfile(user.id)
      setMounted(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        fetchProfile(u.id)
      } else {
        setRole(null)
        setFirstName(null)
        setLastName(null)
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

  if (!mounted) {
    return <div className="w-24 h-9" />
  }

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Button className="rounded-full px-6 hover:opacity-90 cursor-pointer">
          <Link href="/login">Login</Link>
        </Button>
        <Link href="/signup" className="text-sm text-zinc-700 hover:text-zinc-900 transition-colors hidden sm:inline">
          Sign Up
        </Link>
      </div>
    )
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || null
  const initial = (firstName || user.email || "U")[0].toUpperCase()

  return (
    <div className="flex items-center gap-1">
      <CartButton />

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 cursor-pointer rounded-full p-1 hover:bg-zinc-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
            {initial}
          </div>
          <ChevronDown className={`size-3.5 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 bg-white shadow-md py-1 z-50">
            {/* Identity header */}
            <div className="px-4 py-2.5 border-b border-zinc-100 mb-1">
              {fullName && (
                <p className="text-sm font-semibold text-zinc-900 truncate">{fullName}</p>
              )}
              <p className="text-xs text-zinc-400 truncate">{user.email}</p>
            </div>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <UserCircle className="size-4 text-zinc-400" />
              My Profile
            </Link>
            <Link
              href="/my-courses"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <GraduationCap className="size-4 text-zinc-400" />
              My Courses
            </Link>
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
    </div>
  )
}
