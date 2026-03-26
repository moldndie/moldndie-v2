"use client"

import { useState } from "react"
import { UserX, UserCheck } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { deactivateUser, reactivateUser } from "@/services/user.service"
import type { Profile } from "@/types"

interface DeactivateUserModalProps {
  open: boolean
  onClose: () => void
  user: Profile | null
  onSuccess?: () => void
  onConfirm?: () => Promise<void>
  isPending?: boolean
}

export function DeactivateUserModal({
  open,
  onClose,
  user,
  onSuccess,
  onConfirm,
  isPending,
}: DeactivateUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isActive = user?.is_active ?? true
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "this user"
  const busy = isPending ?? loading

  async function handleConfirm() {
    if (!user) return
    setError(null)
    if (onConfirm) {
      setLoading(true)
      try {
        await onConfirm()
        onSuccess?.()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed")
      } finally {
        setLoading(false)
      }
      return
    }
    setLoading(true)
    try {
      if (isActive) {
        await deactivateUser(user.id)
      } else {
        await reactivateUser(user.id)
      }
      onSuccess?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isActive ? "Deactivate User" : "Reactivate User"}
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
              isActive ? "bg-red-100" : "bg-green-100"
            }`}
          >
            {isActive ? (
              <UserX className={`size-5 text-red-600`} />
            ) : (
              <UserCheck className={`size-5 text-green-600`} />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">
              {isActive ? "Deactivate" : "Reactivate"} <span className="font-semibold">{name}</span>?
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {isActive
                ? "This user will no longer be able to log in. You can reactivate them at any time."
                : "This user will be able to log in again."}
            </p>
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={isActive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy
              ? isActive ? "Deactivating…" : "Reactivating…"
              : isActive ? "Deactivate" : "Reactivate"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
