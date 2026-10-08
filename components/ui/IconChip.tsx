import * as React from "react"
import { cn } from "@/lib/utils"

/** Icon + count chip: white by default, dark red on hover (mouse only) or when `active`. */
function IconChip({
  active,
  className,
  ...props
}: React.ComponentProps<"span"> & { active?: boolean }) {
  return (
    <span
      data-active={active || undefined}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-white px-2 py-1 text-xs text-zinc-600 transition-colors",
        "[@media(hover:hover)]:hover:border-primary [@media(hover:hover)]:hover:bg-primary [@media(hover:hover)]:hover:text-primary-foreground",
        "data-active:border-primary data-active:bg-primary data-active:text-primary-foreground",
        className
      )}
      {...props}
    />
  )
}

export { IconChip }
