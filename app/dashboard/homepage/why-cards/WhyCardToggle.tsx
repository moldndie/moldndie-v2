"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { setWhyCardActive } from "@/services/homeWhyCards.service"
import { cn } from "@/lib/utils"

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
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50",
        isActive ? "bg-emerald-500" : "bg-zinc-200"
      )}
      aria-label={isActive ? "Deactivate card" : "Activate card"}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",
          isActive ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )
}
