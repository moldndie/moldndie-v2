"use client"

import { cn } from "@/lib/utils"

interface SwitchProps extends Omit<React.ComponentProps<"button">, "onChange"> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  size?: "sm" | "md"
}

export function Switch({ checked, onCheckedChange, size = "sm", className, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-active={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-5 w-9" : "h-6 w-11",
        checked ? "bg-primary" : "bg-zinc-200",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none inline-block transform rounded-full bg-white shadow transition duration-200",
          size === "sm" ? "size-4" : "size-5",
          checked ? (size === "sm" ? "translate-x-4" : "translate-x-5") : "translate-x-0"
        )}
      />
    </button>
  )
}
