"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Country as PhoneCountry } from "react-phone-number-input"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import CountrySelectField from "@/components/ui/CountrySelectField"
import PhoneInputField from "@/components/ui/PhoneInputField"
import { userEditSchema, type UserEditValues } from "@/schemas/user.schema"
import { updateUser } from "@/services/user.service"
import type { Country as LibCountry } from "@/lib/countries"
import type { Profile } from "@/types"

interface UserEditModalProps {
  open: boolean
  onClose: () => void
  user: Profile | null
  currentUserRole: "admin" | "user"
  onSuccess?: () => void
  onSave?: (values: UserEditValues) => Promise<unknown>
}

export function UserEditModal({
  open,
  onClose,
  user,
  currentUserRole,
  onSuccess,
  onSave,
}: UserEditModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry>("EG")

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserEditValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      country_code: "",
      role: "user",
    },
  })

  useEffect(() => {
    if (open && user) {
      reset({
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        phone: user.phone ?? "",
        country_code: user.country_code ?? "",
        role: user.role,
      })
      if (user.country_code) setPhoneCountry(user.country_code as PhoneCountry)
      setError(null)
    }
  }, [open, user, reset])

  async function onSubmit(values: UserEditValues) {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      if (onSave) {
        await onSave(values)
      } else {
        await updateUser(user.id, {
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone || null,
          country_code: values.country_code || null,
          role: values.role,
        })
      }
      onSuccess?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit User" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">First Name *</label>
            <Input {...register("first_name")} placeholder="First name" />
            {errors.first_name && (
              <p className="text-xs text-red-500">{errors.first_name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Last Name *</label>
            <Input {...register("last_name")} placeholder="Last name" />
            {errors.last_name && (
              <p className="text-xs text-red-500">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Country</label>
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
          {errors.country_code && (
            <p className="text-xs text-red-500">{errors.country_code.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Phone</label>
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

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Role</label>
          <Select {...register("role")} disabled={currentUserRole !== "admin"}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>
          {currentUserRole !== "admin" && (
            <p className="text-xs text-zinc-400">Only admins can change roles.</p>
          )}
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
