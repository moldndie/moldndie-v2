import { Metadata } from "next"
import PageHeader from "@/components/dashboard/PageHeader"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Blogs | Admin" }

export default function BlogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Blogs"
        description="Manage your blog posts."
        action={<Button>Create Blog</Button>}
      />
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
        No blogs yet. Blogs table will appear here.
      </div>
    </div>
  )
}
