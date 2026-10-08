"use client"

import { Input } from "@/components/ui/input"
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
import { Button } from "@/components/ui/button"


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
        <Button size="lg"
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
         
        >
          <Plus size={15} /> Add Step
        </Button>
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
              className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-3 sm:flex-row sm:items-center"
            >
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {idx + 1}
              </span>
              <Input
                className={`h-auto py-2 sm:w-48`}
                defaultValue={step.label}
                onBlur={(e) => save(step, { label: e.target.value })}
                placeholder="Step name"
              />
              <Input
                className={`h-auto py-2 flex-1`}
                defaultValue={step.description ?? ""}
                onBlur={(e) => save(step, { description: e.target.value })}
                placeholder="One-line description"
              />
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => move(step, idx, -1)}
                  disabled={idx === 0}
                  variant="outline" size="icon-xs"
                  title="Move up"
                >
                  <ArrowUp size={13} />
                </Button>
                <Button
                  onClick={() => move(step, idx, 1)}
                  disabled={idx === steps.length - 1}
                  variant="outline" size="icon-xs"
                  title="Move down"
                >
                  <ArrowDown size={13} />
                </Button>
                <Button variant="outline" size="icon-xs" aria-pressed={step.is_active}
                  onClick={() => toggleMut.mutate({ id: step.id, is_active: !step.is_active })}
                  title={step.is_active ? "Visible" : "Hidden"}
                >
                  {step.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </Button>
                <Button
                  onClick={() => {
                    if (confirm(`Delete the "${step.label}" step?`)) deleteMut.mutate(step.id)
                  }}
                  variant="ghost-danger" size="icon-xs"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
