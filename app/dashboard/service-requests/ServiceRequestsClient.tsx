"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Mail, Phone, Tag, Clock, CheckCheck, Loader2 } from "lucide-react"

type ServiceRequest = {
  id: string
  name: string
  email: string
  phone: string | null
  service_type: string | null
  message: string
  is_read: boolean
  created_at: string
}

const QUERY_KEY = ["service-requests"]

async function fetchRequests(): Promise<ServiceRequest[]> {
  const res = await fetch("/api/service-requests")
  if (!res.ok) throw new Error("Failed to load requests.")
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.requests ?? []
}

async function patchMarkRead(id: string): Promise<void> {
  const res = await fetch(`/api/service-requests/${id}`, { method: "PATCH" })
  if (!res.ok) throw new Error("Failed to mark as read.")
}

export default function ServiceRequestsClient() {
  const qc = useQueryClient()

  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchRequests,
    staleTime: 2 * 60 * 1000,
  })

  const markRead = useMutation({
    mutationFn: patchMarkRead,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY })
      const prev = qc.getQueryData<ServiceRequest[]>(QUERY_KEY)
      qc.setQueryData<ServiceRequest[]>(QUERY_KEY, (old = []) =>
        old.map((r) => (r.id === id ? { ...r, is_read: true } : r))
      )
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEY, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-zinc-400 text-sm py-12 justify-center">
        <Loader2 size={16} className="animate-spin" />
        Loading requests…
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-500 py-8 text-center">{(error as Error).message}</p>
  }

  if (requests.length === 0) {
    return <p className="text-sm text-zinc-400 py-12 text-center">No service requests yet.</p>
  }

  const unread = requests.filter((r) => !r.is_read)
  const read   = requests.filter((r) => r.is_read)

  return (
    <div className="space-y-8">
      {unread.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
            Unread ({unread.length})
          </h2>
          <div className="grid gap-4">
            {unread.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onMarkRead={() => markRead.mutate(req.id)}
                isMarking={markRead.isPending && markRead.variables === req.id}
              />
            ))}
          </div>
        </section>
      )}

      {read.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
            Read ({read.length})
          </h2>
          <div className="grid gap-4">
            {read.map((req) => (
              <RequestCard key={req.id} req={req} onMarkRead={() => {}} isMarking={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function RequestCard({
  req,
  onMarkRead,
  isMarking,
}: {
  req: ServiceRequest
  onMarkRead: () => void
  isMarking: boolean
}) {
  const date = new Date(req.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div
      className={`rounded-2xl border p-5 transition-colors ${
        req.is_read
          ? "border-zinc-200 bg-white"
          : "border-primary/30 bg-primary/5 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900">{req.name}</span>
            {!req.is_read && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-white rounded-full px-2 py-0.5">
                New
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Mail size={13} className="text-zinc-400" />
              {req.email}
            </span>
            {req.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={13} className="text-zinc-400" />
                {req.phone}
              </span>
            )}
            {req.service_type && (
              <span className="flex items-center gap-1.5">
                <Tag size={13} className="text-zinc-400" />
                {req.service_type}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-zinc-400" />
              {date}
            </span>
          </div>
        </div>

        {!req.is_read && (
          <button
            onClick={onMarkRead}
            disabled={isMarking}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
          >
            {isMarking ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={13} />}
            Mark as read
          </button>
        )}
      </div>

      <p className="mt-4 text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed border-t border-zinc-100 pt-4">
        {req.message}
      </p>
    </div>
  )
}
