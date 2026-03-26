"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { userCreateSchema, type UserCreateValues } from "@/schemas/user.schema"

interface UserCreateModalProps {
  open: boolean
  onClose: () => void
  onSave: (values: UserCreateValues) => Promise<unknown>
}

export function UserCreateModal({ open, onClose, onSave }: UserCreateModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserCreateValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: { email: "", password: "", role: "user" },
  })

  async function onSubmit(values: UserCreateValues) {
    setSaving(true)
    setError(null)
    try {
      await onSave(values)
      reset()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
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
    <Modal open={open} onClose={handleClose} title="Create User" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Email *</label>
          <Input {...register("email")} type="email" placeholder="user@example.com" />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Password *</label>
          <Input {...register("password")} type="password" placeholder="Min. 6 characters" />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Role</label>
          <Select {...register("role")}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>
          {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Creating…" : "Create User"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
