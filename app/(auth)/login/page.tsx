import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in" };

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams

  return (
    <div className="w-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Welcome Back</h1>
        <p className="mt-1 text-sm text-zinc-500">Sign in to your account</p>
      </div>
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}
