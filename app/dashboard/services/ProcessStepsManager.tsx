"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, ArrowUp, ArrowDown, Loader2, ToggleLeft, ToggleRight } from "lucide-react"
import {
  getProcessSteps,
  createProcessStep,
  updateProcessStep,
  deleteProcessStep,
  toggleProcessStepActive,
  updateProcessStepOrder,
  type ServiceProcessStep,
} from "@/services/serviceProcessSteps.service"

const inputCls =
  "w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"

/**
 * The numbered "How It Works" strip on /services. Edited inline rather than in
 * a modal — a step is just a label plus a one-line caption, so a form would be
 * more chrome than content.
 */
export default function ProcessStepsManager() {
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const { data: steps = [], isLoading } = useQuery({
    queryKey: ["service-process-steps"],
    queryFn: getProcessSteps,
    staleTime: 2 * 60 * 1000,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ["service-process-steps"] })
  const onError = (e: unknown) => setError(e instanceof Error ? e.message : "Something went wrong.")

  const createMut = useMutation({ mutationFn: createProcessStep, onSuccess: invalidate, onError })
  const updateMut = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Parameters<typeof updateProcessStep>[1] }) =>
      updateProcessStep(id, values),
    onSuccess: invalidate,
    onError,
  })
  const deleteMut = useMutation({ mutationFn: deleteProcessStep, onSuccess: invalidate, onError })
  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleProcessStepActive(id, is_active),
    onSuccess: invalidate,
    onError,
  })
  const orderMut = useMutation({
    mutationFn: ({ id, sort_order }: { id: string; sort_order: number }) =>
      updateProcessStepOrder(id, sort_order),
    onSuccess: invalidate,
    onError,
  })

  function move(step: ServiceProcessStep, idx: number, dir: -1 | 1) {
    const other = steps[idx + dir]
    if (!other) return
    orderMut.mutate({ id: step.id, sort_order: other.sort_order })
    orderMut.mutate({ id: other.id, sort_order: step.sort_order })
  }

  function save(step: ServiceProcessStep, patch: Partial<ServiceProcessStep>) {
    const next = { ...step, ...patch }
    if (next.label === step.label && next.description === step.description) return
    if (!next.label.trim()) return
    updateMut.mutate({
      id: step.id,
      values: {
        label: next.label,
        description: next.description ?? "",
        sort_order: next.sort_order,
        is_active: next.is_active,
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">How It Works</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            The numbered steps shown above the services on the public page.
          </p>
        </div>
        <button
          onClick={() => {
            setError(null)
            createMut.mutate({
              label: "New step",
              description: "",
              sort_order: steps.reduce((a, s) => Math.max(a, s.sort_order), 0) + 1,
              is_active: true,
            })
          }}
          disabled={createMut.isPending}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={15} /> Add Step
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-zinc-300" />
        </div>
      ) : steps.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 py-12 text-center">
          <p className="text-sm text-zinc-500">No steps yet — the section is hidden.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3 sm:flex-row sm:items-center"
            >
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {idx + 1}
              </span>
              <input
                className={`${inputCls} sm:w-48`}
                defaultValue={step.label}
                onBlur={(e) => save(step, { label: e.target.value })}
                placeholder="Step name"
              />
              <input
                className={`${inputCls} flex-1`}
                defaultValue={step.description ?? ""}
                onBlur={(e) => save(step, { description: e.target.value })}
                placeholder="One-line description"
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(step, idx, -1)}
                  disabled={idx === 0}
                  className="p-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors"
                  title="Move up"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  onClick={() => move(step, idx, 1)}
                  disabled={idx === steps.length - 1}
                  className="p-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors"
                  title="Move down"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  onClick={() => toggleMut.mutate({ id: step.id, is_active: !step.is_active })}
                  className={`p-1 transition-colors ${step.is_active ? "text-emerald-600" : "text-zinc-400"}`}
                  title={step.is_active ? "Visible" : "Hidden"}
                >
                  {step.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete the "${step.label}" step?`)) deleteMut.mutate(step.id)
                  }}
                  className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
