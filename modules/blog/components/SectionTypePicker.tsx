"use client"

import { useState } from "react"
import { AlignLeft, ImageIcon, Quote, List, Play, Type, ArrowLeft, Check } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BlockType } from "@/types/blog"
import type { Section } from "../types"
import { makeBlock } from "../utils/sections"

// ─── Block type options ───────────────────────────────────────────────────────

const BLOCK_OPTIONS: {
  type: BlockType
  label: string
  icon: React.ElementType
  accent: string
}[] = [
  { type: "paragraph", label: "Text",    icon: AlignLeft,  accent: "border-zinc-300 hover:border-zinc-600 data-[selected]:border-zinc-800 data-[selected]:bg-zinc-50" },
  { type: "image",     label: "Image",   icon: ImageIcon,  accent: "border-emerald-200 hover:border-emerald-500 data-[selected]:border-emerald-600 data-[selected]:bg-emerald-50" },
  { type: "quote",     label: "Quote",   icon: Quote,      accent: "border-amber-200 hover:border-amber-500 data-[selected]:border-amber-600 data-[selected]:bg-amber-50" },
  { type: "video",     label: "Video",   icon: Play,       accent: "border-rose-200 hover:border-rose-500 data-[selected]:border-rose-600 data-[selected]:bg-rose-50" },
  { type: "list",      label: "List",    icon: List,       accent: "border-violet-200 hover:border-violet-500 data-[selected]:border-violet-600 data-[selected]:bg-violet-50" },
  { type: "heading",   label: "Heading", icon: Type,       accent: "border-blue-200 hover:border-blue-500 data-[selected]:border-blue-600 data-[selected]:bg-blue-50" },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface SectionTypePickerProps {
  open: boolean
  onClose: () => void
  onAdd: (section: Section) => void
}

type Step = "layout" | "full-type" | "two-col-types"

// ─── Main component ───────────────────────────────────────────────────────────

export function SectionTypePicker({ open, onClose, onAdd }: SectionTypePickerProps) {
  const [step, setStep] = useState<Step>("layout")
  const [leftType, setLeftType] = useState<BlockType | null>(null)
  const [rightType, setRightType] = useState<BlockType | null>(null)

  function reset() {
    setStep("layout")
    setLeftType(null)
    setRightType(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleAddFull(type: BlockType) {
    onAdd({
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: "full-width",
      block: makeBlock(type),
    })
    reset()
  }

  function handleAddTwoCol() {
    if (!leftType || !rightType) return
    onAdd({
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: "two-column",
      left: makeBlock(leftType),
      right: makeBlock(rightType),
    })
    reset()
  }

  const titles: Record<Step, string> = {
    "layout":        "Add a section",
    "full-type":     "Choose content type",
    "two-col-types": "Choose column types",
  }

  return (
    <Modal open={open} onClose={handleClose} title={titles[step]} size="md">
      {step === "layout" && (
        <LayoutStep
          onFull={() => setStep("full-type")}
          onTwoCol={() => setStep("two-col-types")}
        />
      )}

      {step === "full-type" && (
        <FullTypeStep
          onBack={() => setStep("layout")}
          onSelect={handleAddFull}
        />
      )}

      {step === "two-col-types" && (
        <TwoColStep
          leftType={leftType}
          rightType={rightType}
          onSetLeft={setLeftType}
          onSetRight={setRightType}
          onBack={() => setStep("layout")}
          onAdd={handleAddTwoCol}
        />
      )}
    </Modal>
  )
}

// ─── Step 1: Layout choice ────────────────────────────────────────────────────

function LayoutStep({ onFull, onTwoCol }: { onFull: () => void; onTwoCol: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <LayoutCard
        label="Full Width"
        description="One block spans the full width"
        onClick={onFull}
        preview={
          <div className="flex items-center justify-center py-4">
            <div className="w-4/5 h-8 rounded-lg bg-zinc-200 group-hover:bg-zinc-300 transition-colors" />
          </div>
        }
      />
      <LayoutCard
        label="Two Columns"
        description="Two blocks side by side"
        onClick={onTwoCol}
        preview={
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="w-[38%] h-8 rounded-lg bg-zinc-200 group-hover:bg-zinc-300 transition-colors" />
            <div className="w-[38%] h-8 rounded-lg bg-zinc-200 group-hover:bg-zinc-300 transition-colors" />
          </div>
        }
      />
    </div>
  )
}

function LayoutCard({
  label,
  description,
  preview,
  onClick,
}: {
  label: string
  description: string
  preview: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-xl border-2 border-zinc-200 p-4 text-left hover:border-zinc-800 transition-all"
    >
      <div className="mb-3 rounded-lg bg-zinc-100 group-hover:bg-zinc-100/80">
        {preview}
      </div>
      <p className="font-semibold text-sm text-zinc-900">{label}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
    </button>
  )
}

// ─── Step 2a: Full-width block type ───────────────────────────────────────────

function FullTypeStep({
  onBack,
  onSelect,
}: {
  onBack: () => void
  onSelect: (type: BlockType) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        {BLOCK_OPTIONS.map(({ type, label, icon: Icon, accent }) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:shadow-sm",
              accent
            )}
          >
            <Icon className="size-5 text-zinc-600" />
            <span className="text-xs font-medium text-zinc-700">{label}</span>
          </button>
        ))}
      </div>

      <div className="pt-1 border-t border-zinc-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </button>
      </div>
    </div>
  )
}

// ─── Step 2b: Two-column block types ─────────────────────────────────────────

function TwoColStep({
  leftType,
  rightType,
  onSetLeft,
  onSetRight,
  onBack,
  onAdd,
}: {
  leftType: BlockType | null
  rightType: BlockType | null
  onSetLeft: (t: BlockType) => void
  onSetRight: (t: BlockType) => void
  onBack: () => void
  onAdd: () => void
}) {
  const canAdd = leftType !== null && rightType !== null

  return (
    <div className="space-y-4">
      {/* Preview diagram */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-50 border border-zinc-100 p-3">
        <ColumnPreview label="Left" type={leftType} />
        <ColumnPreview label="Right" type={rightType} />
      </div>

      {/* Column selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Left column</p>
          <BlockTypeGrid selected={leftType} onSelect={onSetLeft} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Right column</p>
          <BlockTypeGrid selected={rightType} onSelect={onSetRight} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </button>
        <Button type="button" onClick={onAdd} disabled={!canAdd} size="sm">
          <Check className="size-3.5 mr-1" />
          Add Section
        </Button>
      </div>
    </div>
  )
}

function ColumnPreview({ label, type }: { label: string; type: BlockType | null }) {
  const option = BLOCK_OPTIONS.find((o) => o.type === type)
  const Icon = option?.icon

  return (
    <div className="rounded-lg border-2 border-dashed border-zinc-200 p-3 min-h-[56px] flex flex-col items-center justify-center gap-1">
      {option && Icon ? (
        <>
          <Icon className="size-4 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-500">{option.label}</span>
        </>
      ) : (
        <span className="text-xs text-zinc-300">{label}</span>
      )}
    </div>
  )
}

function BlockTypeGrid({
  selected,
  onSelect,
}: {
  selected: BlockType | null
  onSelect: (t: BlockType) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {BLOCK_OPTIONS.map(({ type, label, icon: Icon }) => {
        const isSelected = selected === type
        return (
          <button
            key={type}
            type="button"
            data-selected={isSelected || undefined}
            onClick={() => onSelect(type)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all",
              isSelected
                ? "border-zinc-800 bg-zinc-900 text-white"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
            )}
          >
            <Icon className="size-3 shrink-0" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
