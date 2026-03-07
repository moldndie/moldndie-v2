import { FileText, Package, Users, BookOpen } from "lucide-react"

const stats = [
  { label: "Total Blogs", value: "—", icon: FileText, color: "bg-blue-50 text-blue-600" },
  { label: "Total Molds", value: "—", icon: Package, color: "bg-purple-50 text-purple-600" },
  { label: "Total Users", value: "—", icon: Users, color: "bg-green-50 text-green-600" },
  { label: "Total Courses", value: "—", icon: BookOpen, color: "bg-orange-50 text-orange-600" },
]

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="rounded-xl border border-zinc-200 bg-white p-5 flex items-center gap-4"
        >
          <div className={`rounded-lg p-2.5 ${color}`}>
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="text-2xl font-semibold text-zinc-900">{value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
