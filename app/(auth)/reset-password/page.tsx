"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { resetPasswordSchema, type ResetPasswordInput } from "@/schemas/auth.schema";
import { resetPasswordAction } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(data: ResetPasswordInput) {
    const result = await resetPasswordAction(data);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Password updated successfully!");
      router.push("/login");
    }
  }

  return (
    <div className="w-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Set New Password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* New Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
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
              placeholder="Repeat your password"
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

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 cursor-pointer hover:opacity-90"
        >
          {isSubmitting ? "Updating..." : "Set new password"}
        </Button>
      </form>
    </div>
  );
}
