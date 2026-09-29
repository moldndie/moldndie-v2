"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { setWhyCardActive } from "@/services/homeWhyCards.service"
import { Switch } from "@/components/ui/switch"

interface Props {
  id: string
  isActive: boolean
}

export default function WhyCardToggle({ id, isActive }: Props) {
  const [isPending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      try {
        await setWhyCardActive(id, !isActive)
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
