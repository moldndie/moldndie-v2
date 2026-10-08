import { IconChip } from "@/components/ui/IconChip"
import { Eye } from "lucide-react"
import { getContentViewCount } from "@/services/contentViews.service"

interface ViewCountProps {
  contentType: "blog" | "course" | "mold" | "event" | "calculator" | "supplier" | "service"
  contentId: string
  className?: string
}

export async function ViewCount({ contentType, contentId, className }: ViewCountProps) {
  const count = await getContentViewCount(contentType, contentId)
  if (count === 0) return null

  const formatted = count >= 1_000_000
    ? `${(count / 1_000_000).toFixed(1)}M`
    : count >= 1_000
    ? `${(count / 1_000).toFixed(1)}k`
    : count.toLocaleString()

  return (
    <IconChip className={className}>
      <Eye size={12} className="shrink-0" />
      {formatted} {count === 1 ? "view" : "views"}
    </IconChip>
  )
}
