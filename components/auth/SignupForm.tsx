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

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
