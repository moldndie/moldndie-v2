import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();

  const connected = !error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm w-full max-w-md">
        <h1 className="text-xl font-semibold text-zinc-900 mb-4">
          Supabase Connection Test
        </h1>

        <div
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
            connected
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
          {connected ? "Connected to Supabase successfully" : `Connection failed: ${error?.message}`}
        </div>

        <div className="mt-4 rounded-lg bg-zinc-50 border border-zinc-200 p-4 text-xs font-mono text-zinc-600 space-y-1">
          <div>
            <span className="text-zinc-400">URL: </span>
            {process.env.NEXT_PUBLIC_SUPABASE_URL}
          </div>
          <div>
            <span className="text-zinc-400">Session: </span>
            {data.session ? "Active" : "None (expected — not logged in)"}
          </div>
        </div>
      </div>
    </div>
  );
}
