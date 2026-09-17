"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import CountrySelectField from "@/components/ui/CountrySelectField"
import type { Country as LibCountry } from "@/lib/countries"
import { userCreateSchema, type UserCreateValues } from "@/schemas/user.schema"

interface UserCreateModalProps {
  open: boolean
  onClose: () => void
  onSave: (values: UserCreateValues) => Promise<unknown>
}

export function UserCreateModal({ open, onClose, onSave }: UserCreateModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // After a successful invite: the personal link + name, for the share step.
  const [sent, setSent] = useState<{ url: string; name: string } | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserCreateValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      country_code: "",
      role: "user",
    },
  })

  async function onSubmit(values: UserCreateValues) {
    setSaving(true)
    setError(null)
    try {
      const result = (await onSave(values)) as { invite_url?: string } | undefined
      reset()
      if (result?.invite_url) setSent({ url: result.invite_url, name: values.first_name })
      else onClose()
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
    setSent(null)
    onClose()
  }

  if (sent) {
    return (
      <Modal open={open} onClose={handleClose} title="Invitation sent" size="md">
        <InviteShare url={sent.url} name={sent.name} onDone={handleClose} />
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title="Invite User" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

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

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Email *</label>
          <Input {...register("email")} type="email" placeholder="user@example.com" />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          <p className="text-xs text-zinc-400">
            An invitation email will be sent so the user can set their own password.
          </p>
        </div>

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

// ── Share step ────────────────────────────────────────────────────────────────
// No SMS/WhatsApp provider needed: these links open the admin's own app with the
// message filled in. The invite link is personal (it lets its holder set the
// password for that email), so it is only offered for direct messages; the
// public buttons share the sign-up page instead.

const SHARE_BTN =
  "inline-flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-primary hover:text-primary"

function InviteShare({ url, name, onDone }: { url: string; name: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false)
  const msg = `Hi ${name}, you're invited to join MoldNdie — the mold & die professionals' platform. Set your password here: ${url}`
  const text = encodeURIComponent(msg)
  const signup = encodeURIComponent(`${window.location.origin}/signup`)
  const pitch = encodeURIComponent("Join MoldNdie — resources, courses and tools for mold & die professionals.")

  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-600">
        The invitation email is on its way. You can also send the same personal invitation directly:
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <a className={SHARE_BTN} href={`https://wa.me/?text=${text}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a className={SHARE_BTN} href={`sms:?&body=${text}`}>SMS</a>
        <a className={SHARE_BTN} href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Hi ${name}, you're invited to join MoldNdie. Set your password here:`)}`} target="_blank" rel="noopener noreferrer">Telegram</a>
        <button
          type="button"
          className={SHARE_BTN}
          onClick={() => navigator.clipboard.writeText(msg).then(() => setCopied(true))}
        >
          {copied ? "Copied" : "Copy message"}
        </button>
      </div>
      <p className="text-xs text-zinc-400">This link is personal — send it only to {name}.</p>

      <div className="space-y-2 border-t border-zinc-100 pt-4">
        <p className="text-sm text-zinc-600">Invite people publicly (shares the sign-up page):</p>
        <div className="grid grid-cols-3 gap-2">
          <a className={SHARE_BTN} href={`https://www.facebook.com/sharer/sharer.php?u=${signup}`} target="_blank" rel="noopener noreferrer">Facebook</a>
          <a className={SHARE_BTN} href={`https://www.linkedin.com/sharing/share-offsite/?url=${signup}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a className={SHARE_BTN} href={`https://twitter.com/intent/tweet?url=${signup}&text=${pitch}`} target="_blank" rel="noopener noreferrer">X</a>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={onDone}>Done</Button>
      </div>
    </div>
  )
}
