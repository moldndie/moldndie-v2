import { requireModule } from "@/services/siteSettings.service"

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireModule("events")
  return children
}
