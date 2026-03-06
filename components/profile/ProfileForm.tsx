"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileInput } from "@/schemas/profile.schema";
import { updateProfileAction } from "@/app/account/profile/actions";
import CountrySelectField from "@/components/ui/CountrySelectField";
import PhoneInputField from "@/components/ui/PhoneInputField";
import type { Country as LibCountry } from "@/lib/countries";
import type { Country as PhoneCountry } from "react-phone-number-input";
import type { Profile } from "@/types/profile";

type Props = { profile: Profile };

export default function ProfileForm({ profile }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry>(
    (profile.country_code as PhoneCountry) ?? "EG"
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      phone: profile.phone ?? "",
      country_code: profile.country_code ?? "",
    },
  });

  async function onSubmit(data: ProfileInput) {
    setServerError(null);
    setSuccess(false);
    const result = await updateProfileAction(data);
    if (result.error) setServerError(result.error);
    else setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Profile updated successfully.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="first_name" className="block text-sm font-medium text-zinc-700">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="first_name"
            type="text"
            placeholder="John"
            {...register("first_name")}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
          {errors.first_name && (
            <p className="text-xs text-red-600">{errors.first_name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="last_name" className="block text-sm font-medium text-zinc-700">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="last_name"
            type="text"
            placeholder="Doe"
            {...register("last_name")}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
          {errors.last_name && (
            <p className="text-xs text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
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
        {errors.country_code && (
          <p className="text-xs text-red-600">{errors.country_code.message}</p>
        )}
      </div>

      <div className="space-y-1">
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
