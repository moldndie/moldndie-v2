"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { signupSchema, type SignupInput } from "@/schemas/auth.schema";
import { signupAction } from "@/app/(auth)/signup/actions";
import CountrySelectField from "@/components/ui/CountrySelectField";
import PhoneInputField from "@/components/ui/PhoneInputField";
import type { Country as LibCountry } from "@/lib/countries";
import type { Country as PhoneCountry } from "react-phone-number-input";

const inputCls =
  "w-full rounded-lg border border-zinc-300 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function SignupForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry>("EG");

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
    setServerError(null);
    const result = await signupAction(data);
    if (result?.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* First & Last Name */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="first_name" className="block text-sm font-medium text-zinc-700">
            First Name
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              id="first_name"
              type="text"
              placeholder="John"
              {...register("first_name")}
              className={`${inputCls} pl-9 pr-3`}
            />
          </div>
          {errors.first_name && (
            <p className="text-xs text-red-600">{errors.first_name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="last_name" className="block text-sm font-medium text-zinc-700">
            Last Name
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              id="last_name"
              type="text"
              placeholder="Doe"
              {...register("last_name")}
              className={`${inputCls} pl-9 pr-3`}
            />
          </div>
          {errors.last_name && (
            <p className="text-xs text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
          Email
        </label>
        <div className="relative">
          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
            className={`${inputCls} pl-9 pr-3`}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Country */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">Country</label>
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
        <label className="block text-sm font-medium text-zinc-700">Phone Number</label>
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
        <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
          Password
        </label>
        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Set your password"
            {...register("password")}
            className={`${inputCls} pl-9 pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label htmlFor="confirm_password" className="block text-sm font-medium text-zinc-700">
          Confirm Password
        </label>
        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            id="confirm_password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirm your password"
            {...register("confirm_password")}
            className={`${inputCls} pl-9 pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.confirm_password && (
          <p className="text-xs text-red-600">{errors.confirm_password.message}</p>
        )}
      </div>

      {/* Terms */}
      <div className="space-y-1">
        <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register("terms")}
            className="h-4 w-4 rounded border-zinc-300 accent-[#7C2020] cursor-pointer"
          />
          I agree to{" "}
          <Link href="/terms" className="font-semibold text-[#7C2020] hover:underline">
            Term &amp; Condition
          </Link>
        </label>
        {errors.terms && (
          <p className="text-xs text-red-600">{errors.terms.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-[#7C2020] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#6b1b1b] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Creating account..." : "Sign up"}
      </button>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#7C2020] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
