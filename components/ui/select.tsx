import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "h-9 w-full appearance-none rounded-lg border border-input bg-white pl-3 pr-8 py-1 text-sm transition-colors outline-none cursor-pointer",
          "focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}

export { Select }
