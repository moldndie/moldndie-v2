import { redirect } from "next/navigation"

// Categories are now managed inside the Engineering Tools page tabs.
export default function CalcCategoriesRedirect() {
  redirect("/dashboard/calculators")
}
