import { getCurrentUser } from "@/services/auth.service";
import { logoutAction } from "@/services/auth.service";
import { redirect } from "next/navigation";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-900">Dashboard</h1>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">Signed in as</p>
          <p className="mt-1 font-medium text-zinc-900">{user.email}</p>
          <p className="mt-1 text-xs font-mono text-zinc-400">{user.id}</p>
        </div>
      </main>
    </div>
  );
}
