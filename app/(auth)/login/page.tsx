import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="w-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Welcome Back</h1>
        <p className="mt-1 text-sm text-zinc-500">Sign in to your account</p>
      </div>
      <LoginForm />
    </div>
  );
}
