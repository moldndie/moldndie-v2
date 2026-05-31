import {
  BookOpen,
  GraduationCap,
  FolderOpen,
  CalendarDays,
  Globe,
  Calculator,
  Award,
  Layers,
  TrendingUp,
  GitBranch,
  Wrench,
  Cpu,
  Database,
  Cog,
  Zap,
  Star,
  Shield,
  Users,
  BarChart2,
  FileText,
  Settings,
  HelpCircle,
  type LucideIcon,
} from "lucide-react"

export const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  GraduationCap,
  FolderOpen,
  CalendarDays,
  Calendar: CalendarDays,
  Globe,
  Calculator,
  Award,
  Layers,
  TrendingUp,
  GitBranch,
  Wrench,
  Cpu,
  Database,
  Cog,
  Zap,
  Star,
  Shield,
  Users,
  BarChart2,
  FileText,
  Settings,
  HelpCircle,
}

export const ICON_NAMES = Object.keys(ICON_MAP).filter((k) => k !== "Calendar")

interface DynamicIconProps {
  name: string
  size?: number
  strokeWidth?: number
  className?: string
}

export function DynamicIcon({ name, size = 36, strokeWidth = 1.5, className = "" }: DynamicIconProps) {
  const Icon = ICON_MAP[name] ?? HelpCircle
  return <Icon size={size} strokeWidth={strokeWidth} className={className} />
}
