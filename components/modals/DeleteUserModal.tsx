"use client"

import { useState } from "react"
import { TriangleAlert } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Profile } from "@/types"

interface DeleteUserModalProps {
  open: boolean
  onClose: () => void
  user: Profile | null
  onConfirm: () => Promise<void>
}

export function DeleteUserModal({ open, onClose, user, onConfirm }: DeleteUserModalProps) {
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const name =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "this user"

  function handleClose() {
    setConfirm("")
    setError(null)
    onClose()
  }

  async function handleDelete() {
    if (confirm.toLowerCase() !== "delete") return
    setLoading(true)
    setError(null)
    try {
      await onConfirm()
      setConfirm("")
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Delete User Permanently" size="sm">
      <div className="space-y-5">
        {/* Warning header */}
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-red-600" />
          <div className="text-sm text-red-800">
            <p className="font-semibold">This action is irreversible.</p>
            <p className="mt-0.5">
              Deleting <span className="font-medium">{name}</span> will permanently remove
              their account and anonymize their personal data.
            </p>
          </div>
        </div>

        {/* Confirmation input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">
            Type <span className="font-mono font-bold text-red-600">delete</span> to confirm
          </label>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="delete"
            autoComplete="off"
            className="font-mono"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={confirm.toLowerCase() !== "delete" || loading}
            onClick={handleDelete}
          >
            {loading ? "Deleting…" : "Delete Permanently"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
