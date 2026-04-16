import { redirect } from "next/navigation"
import { getCurrentUser } from "@/services/auth.service"
import { getProfile } from "@/services/profile.service"
import ProfileForm from "@/components/profile/ProfileForm"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { UserCircle } from "lucide-react"

export const metadata = { title: "My Profile | MoldNdie" }

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login?callbackUrl=/profile")

  const profile = await getProfile(user.id)
  if (!profile) redirect("/login")

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shrink-0">
              {(profile.first_name || user.email || "U")[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-zinc-900">My Profile</h1>
              <p className="text-sm text-zinc-500">{user.email}</p>
            </div>
          </div>

          {/* Profile card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <UserCircle className="size-5 text-primary" />
              <h2 className="text-base font-semibold text-zinc-900">Personal Information</h2>
            </div>
            <ProfileForm profile={profile} />
          </div>

          {/* Password section */}
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900 mb-1">Password</h2>
            <p className="text-sm text-zinc-500 mb-4">
              To change your password, use the forgot password flow.
            </p>
            <a
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-2 transition-colors"
            >
              Change password →
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
