"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/schemas/auth.schema";
import { forgotPasswordAction } from "./actions";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(data: ForgotPasswordInput) {
    setServerError(null);
    const result = await forgotPasswordAction(data);
    if (result.error) {
      setServerError(result.error);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="w-full flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <CheckCircle size={28} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">Check your email</h1>
        <p className="mt-2 text-sm text-zinc-500 max-w-xs">
          We sent a password reset link to{" "}
          <span className="font-medium text-zinc-700">{getValues("email")}</span>. Check your inbox
          and follow the link to set a new password.
        </p>
        <p className="mt-6 text-sm text-zinc-500">
          Didn&apos;t receive it?{" "}
          <button
            onClick={() => setSent(false)}
            className="font-semibold text-[#7C2020] hover:underline"
          >
            Try again
          </button>
        </p>
        <Link
          href="/login"
          className="mt-4 flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Forgot Password?</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
            Email
          </label>
          <div className="relative">
            <Mail
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
              className="w-full rounded-lg border border-zinc-300 pl-9 pr-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[#7C2020] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#6b1b1b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>

        <p className="text-center text-sm text-zinc-500">
          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-zinc-400 hover:text-zinc-600"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
