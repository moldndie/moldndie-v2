"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, User, Mail, Lock, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signupSchema, type SignupInput } from "@/schemas/auth.schema";
import { signupAction } from "@/app/(auth)/signup/actions";
import { signInWithGoogleAction } from "@/app/(auth)/google-oauth/actions";
import CountrySelectField from "@/components/ui/CountrySelectField";
import PhoneInputField from "@/components/ui/PhoneInputField";
import type { Country as LibCountry } from "@/lib/countries";
import type { Country as PhoneCountry } from "react-phone-number-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry>("EG");
  const [emailSent, setEmailSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    const result = await signInWithGoogleAction("/");
    if (result.error) {
      toast.error(result.error);
      setGoogleLoading(false);
    } else if (result.url) {
      window.location.href = result.url;
    }
  }

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { country_code: "", phone: "" },
  });

  async function onSubmit(data: SignupInput) {
    const result = await signupAction(data);
    if (result.error) {
      toast.error(result.error);
    } else if (result.emailVerificationSent) {
      setEmailSent(true);
    } else {
      toast.success("Account created successfully!");
      if (result.role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    }
  }

  if (emailSent) {
    return (
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="size-7 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold text-zinc-900">Check your email</h2>
          <p className="text-sm text-zinc-500">
            Please check your email to verify your account before signing in.
          </p>
        </div>
        <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* First & Last Name */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first_name">First Name</Label>
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="first_name"
              type="text"
              placeholder="John"
              {...register("first_name")}
              className="pl-9 h-10"
            />
          </div>
          {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name">Last Name</Label>
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="last_name"
              type="text"
              placeholder="Doe"
              {...register("last_name")}
              className="pl-9 h-10"
            />
          </div>
          {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
        </div>
      </div>

      {/* Email */}
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

      {/* Country */}
      <div className="space-y-1.5">
        <Label>Country</Label>
        <Controller
          control={control}
          name="country_code"
          render={({ field }) => (
            <CountrySelectField
              name="country_code"
              value={field.value ?? ""}
              onChange={(country: LibCountry | null) => {
                field.onChange(country?.code ?? "");
                if (country) setPhoneCountry(country.code as PhoneCountry);
              }}
              placeholder="Select your country"
            />
          )}
        />
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label>Phone Number</Label>
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <PhoneInputField
              value={field.value ?? ""}
              onChange={field.onChange}
              defaultCountry={phoneCountry}
            />
          )}
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Set your password"
            {...register("password")}
            className="pl-9 pr-10 h-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <Label htmlFor="confirm_password">Confirm Password</Label>
        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            id="confirm_password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirm your password"
            {...register("confirm_password")}
            className="pl-9 pr-10 h-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
      </div>

      {/* Terms */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="terms"
            render={({ field }) => (
              <Checkbox
                id="terms"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <label htmlFor="terms" className="text-sm text-foreground cursor-pointer select-none">
            I agree to{" "}
            <Link href="/terms" className="font-semibold text-primary hover:underline">
              Term &amp; Condition
            </Link>
          </label>
        </div>
        {errors.terms && <p className="text-xs text-destructive">{errors.terms.message}</p>}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-10 cursor-pointer hover:opacity-90"
      >
        {isSubmitting ? "Creating account..." : "Sign up"}
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Google Sign In */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || isSubmitting}
        className="w-full flex items-center justify-center gap-3 h-10 rounded-md border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {googleLoading ? (
          <span className="size-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
