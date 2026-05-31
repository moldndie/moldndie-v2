import type { Metadata } from "next"
import Link from "next/link"
import { Plus, Pencil } from "lucide-react"
import PageHeader from "@/components/dashboard/PageHeader"
import { getAllWhyCards } from "@/services/homeWhyCards.service"
import type { HomeWhyCard } from "@/services/homeWhyCards.service"
import { DynamicIcon } from "@/lib/icons"
import WhyCardToggle from "./WhyCardToggle"

export const metadata: Metadata = { title: "Why Choose Us | Admin" }

export default async function WhyCardsPage() {
  let cards: HomeWhyCard[] = []
  try {
    cards = await getAllWhyCards()
  } catch {
    // table may not exist yet
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Why Choose Us"
        description="Manage the homepage Why Choose Us cards. Only active cards are shown."
      />

      <div className="flex justify-end">
        <Link
          href="/dashboard/homepage/why-cards/new"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          <Plus className="size-4" />
          Add Card
        </Link>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-12 text-center">
          <p className="text-sm font-medium text-zinc-500">No cards yet.</p>
          <p className="mt-1 text-xs text-zinc-400">Run the migration to seed defaults, or add one manually.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-4 py-3 text-left font-semibold text-zinc-500 w-10">#</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-500">Card</th>
                <th className="px-4 py-3 text-center font-semibold text-zinc-500">Active</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {cards.map((card) => (
                <tr key={card.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 text-zinc-400 text-xs">{card.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <DynamicIcon name={card.icon} size={16} strokeWidth={1.5} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">{card.title}</p>
                        {card.description && (
                          <p className="text-xs text-zinc-400 line-clamp-1 max-w-xs">{card.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <WhyCardToggle id={card.id} isActive={card.is_active} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/homepage/why-cards/${card.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
                    >
                      <Pencil className="size-3" />
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
