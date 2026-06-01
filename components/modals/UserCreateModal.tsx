"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, Smartphone } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import CountrySelectField from "@/components/ui/CountrySelectField"
import PhoneInputField from "@/components/ui/PhoneInputField"
import type { Country as LibCountry } from "@/lib/countries"
import type { Country as PhoneCountry } from "react-phone-number-input"
import { userCreateSchema, type UserCreateValues } from "@/schemas/user.schema"

interface UserCreateModalProps {
  open: boolean
  onClose: () => void
  onSave: (values: UserCreateValues) => Promise<unknown>
}

export function UserCreateModal({ open, onClose, onSave }: UserCreateModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry>("EG")

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UserCreateValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      invitation_method: "email",
      email: "",
      phone: "",
      first_name: "",
      last_name: "",
      country_code: "",
      role: "user",
    },
  })

  const method = watch("invitation_method")

  async function onSubmit(values: UserCreateValues) {
    setSaving(true)
    setError(null)
    try {
      await onSave(values)
      reset()
      onClose()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong"
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    reset()
    setError(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Invite User" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Invitation method selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">Invitation Method *</label>
          <div className="grid grid-cols-2 gap-2">
            {(["email", "sms"] as const).map((m) => {
              const Icon = m === "email" ? Mail : Smartphone
              const label = m === "email" ? "Email" : "SMS"
              const selected = method === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setValue("invitation_method", m)
                    if (m === "email") setValue("phone", "")
                    else setValue("email", "")
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    selected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">First Name *</label>
            <Input {...register("first_name")} placeholder="John" />
            {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Last Name *</label>
            <Input {...register("last_name")} placeholder="Doe" />
            {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
          </div>
        </div>

        {/* Email — shown only for email method */}
        {method === "email" && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Email *</label>
            <Input {...register("email")} type="email" placeholder="user@example.com" />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            <p className="text-xs text-zinc-400">
              An invitation email will be sent so the user can set their own password.
            </p>
          </div>
        )}

        {/* Phone — shown only for SMS method */}
        {method === "sms" && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Phone Number *</label>
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
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            <p className="text-xs text-zinc-400">
              The user will receive an SMS with instructions to set their password.
            </p>
          </div>
        )}

        {/* Country (optional) */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Country <span className="text-zinc-400 font-normal">(optional)</span></label>
          <Controller
            control={control}
            name="country_code"
            render={({ field }) => (
              <CountrySelectField
                name="country_code"
                value={field.value ?? ""}
                onChange={(country: LibCountry | null) => {
                  field.onChange(country?.code ?? "")
                  if (country) setPhoneCountry(country.code as PhoneCountry)
                }}
                placeholder="Select country"
              />
            )}
          />
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Role</label>
          <Select {...register("role")}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>
          {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Sending invite…" : "Send Invite"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
