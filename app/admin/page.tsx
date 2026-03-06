import { getCurrentUser, isAdmin } from "@/services/auth.service";
import { redirect } from "next/navigation";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const admin = await isAdmin(user.id);

  if (!admin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-lg font-semibold text-zinc-900">Admin Panel</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">Logged in as admin</p>
          <p className="mt-1 font-medium text-zinc-900">{user.email}</p>
        </div>
      </main>
    </div>
  );
}
