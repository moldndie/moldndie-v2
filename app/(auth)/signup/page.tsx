import SignupForm from "@/components/auth/SignupForm";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="w-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Get Started Now</h1>
        <p className="mt-1 text-sm text-zinc-500">Let&apos;s create your account</p>
      </div>
      <SignupForm />
    </div>
  );
}
