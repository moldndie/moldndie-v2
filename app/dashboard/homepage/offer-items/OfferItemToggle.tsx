"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { setOfferItemActive } from "@/services/homeOfferItems.service"
import { Switch } from "@/components/ui/switch"

interface Props {
  id: string
  isActive: boolean
}

export default function OfferItemToggle({ id, isActive }: Props) {
  const [isPending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      try {
        await setOfferItemActive(id, !isActive)
        toast.success(isActive ? "Card hidden." : "Card visible.")
      } catch (e) {
        toast.error((e as Error).message || "Failed to update.")
      }
    })
  }

  return (
    <Switch
      checked={isActive}
      onCheckedChange={toggle}
      disabled={isPending}
      aria-label={isActive ? "Deactivate card" : "Activate card"}
    />
  )
}
