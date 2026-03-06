import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/auth.service";
import { getProfile } from "@/services/profile.service";
import ProfileForm from "@/components/profile/ProfileForm";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-lg font-semibold text-zinc-900">My Profile</h1>
          <p className="text-sm text-zinc-500">{user.email}</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <ProfileForm profile={profile} />
        </div>
      </main>
    </div>
  );
}
