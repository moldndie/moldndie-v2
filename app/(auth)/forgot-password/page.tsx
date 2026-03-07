"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/schemas/auth.schema";
import { forgotPasswordAction } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(data: ForgotPasswordInput) {
    const result = await forgotPasswordAction(data);
    if (result.error) {
      toast.error(result.error);
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
        <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          We sent a password reset link to{" "}
          <span className="font-medium text-foreground">{getValues("email")}</span>. Check your
          inbox and follow the link to set a new password.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          Didn&apos;t receive it?{" "}
          <button
            onClick={() => setSent(false)}
            className="font-semibold text-primary hover:underline"
          >
            Try again
          </button>
        </p>
        <Link
          href="/login"
          className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
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
        <h1 className="text-3xl font-bold text-foreground">Forgot Password?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
              className="pl-9 h-10"
            />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 cursor-pointer hover:opacity-90"
        >
          {isSubmitting ? "Sending..." : "Send reset link"}
        </Button>

        <p className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
