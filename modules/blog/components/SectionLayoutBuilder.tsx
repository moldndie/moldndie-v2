"use client"

import { useState } from "react"
import {
  ChevronUp, ChevronDown, Trash2, Plus, X, ArrowLeft,
  AlignLeft, ImageIcon, Quote, List, Play, Type,
  Columns2, LayoutTemplate, Paperclip,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { BlockType } from "@/types/blog"
import type { EditorBlock, Section } from "../types"
import { blocksToSections, sectionsToBlocks, makeBlock } from "../utils/sections"
import { HeadingBlock } from "./blocks/HeadingBlock"
import { ParagraphBlock } from "./blocks/ParagraphBlock"
import { ImageBlock } from "./blocks/ImageBlock"
import { QuoteBlock } from "./blocks/QuoteBlock"
import { ListBlock } from "./blocks/ListBlock"
import { VideoBlock } from "./blocks/VideoBlock"
import { FileBlock } from "./blocks/FileBlock"
import type { FileContent } from "./blocks/FileBlock"

// ─── Block type catalogue ─────────────────────────────────────────────────────

const BLOCK_TYPES: {
  type: BlockType
  label: string
  icon: React.ElementType
  badge: string
  pill: string
}[] = [
  {
    type: "paragraph",
    label: "Text",
    icon: AlignLeft,
    badge: "bg-zinc-100 text-zinc-600 border-zinc-200",
    pill: "border-zinc-300 hover:border-zinc-600 hover:bg-zinc-50",
  },
  {
    type: "image",
    label: "Image",
    icon: ImageIcon,
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pill: "border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50",
  },
  {
    type: "quote",
    label: "Quote",
    icon: Quote,
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    pill: "border-amber-200 hover:border-amber-500 hover:bg-amber-50",
  },
  {
    type: "video",
    label: "Video",
    icon: Play,
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    pill: "border-rose-200 hover:border-rose-500 hover:bg-rose-50",
  },
  {
    type: "list",
    label: "List",
    icon: List,
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    pill: "border-violet-200 hover:border-violet-500 hover:bg-violet-50",
  },
  {
    type: "heading",
    label: "Heading",
    icon: Type,
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    pill: "border-blue-200 hover:border-blue-500 hover:bg-blue-50",
  },
  {
    type: "file",
    label: "File",
    icon: Paperclip,
    badge: "bg-teal-50 text-teal-700 border-teal-200",
    pill: "border-teal-200 hover:border-teal-500 hover:bg-teal-50",
  },
]

function blockMeta(type: BlockType) {
  return BLOCK_TYPES.find((b) => b.type === type)!
}

// ─── Main builder ─────────────────────────────────────────────────────────────

interface SectionLayoutBuilderProps {
  value: EditorBlock[]
  onChange: (blocks: EditorBlock[]) => void
}

export function SectionLayoutBuilder({ value, onChange }: SectionLayoutBuilderProps) {
  // Derive sections each render — avoids dual-state sync when editing an existing blog
  const sections = blocksToSections(value)

  function commit(next: Section[]) {
    onChange(sectionsToBlocks(next))
  }

  function addSection(section: Section) {
    commit([...sections, section])
  }

  function removeSection(id: string) {
    commit(sections.filter((s) => s.id !== id))
  }

  function moveSection(id: string, direction: "up" | "down") {
    const idx = sections.findIndex((s) => s.id === id)
    if (direction === "up" && idx === 0) return
    if (direction === "down" && idx === sections.length - 1) return
    const next = [...sections]
    const swap = direction === "up" ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    commit(next)
  }

  function updateBlock(
    sectionId: string,
    side: "block" | "left" | "right",
    content: Record<string, unknown>,
  ) {
    commit(
      sections.map((s) => {
        if (s.id !== sectionId) return s
        if (side === "block" && s.block) return { ...s, block: { ...s.block, content } }
        if (side === "left"  && s.left)  return { ...s, left:  { ...s.left,  content } }
        if (side === "right" && s.right) return { ...s, right: { ...s.right, content } }
        return s
      }),
    )
  }

  return (
    <div className="space-y-2">
      {/* Section cards */}
      {sections.map((section, i) => (
        <SectionCard
          key={section.id}
          section={section}
          index={i}
          total={sections.length}
          onMove={moveSection}
          onRemove={removeSection}
          onUpdateBlock={updateBlock}
        />
      ))}

      {/* Inline composer — empty state or append row */}
      <SectionComposer
        isEmpty={sections.length === 0}
        onAdd={addSection}
      />
    </div>
  )
}

// ─── Inline section composer ──────────────────────────────────────────────────

type ComposerStep = "closed" | "layout" | "full-type" | "two-col"

function SectionComposer({
  isEmpty,
  onAdd,
}: {
  isEmpty: boolean
  onAdd: (section: Section) => void
}) {
  const [step, setStep] = useState<ComposerStep>("closed")
  const [leftType, setLeftType]   = useState<BlockType | null>(null)
  const [rightType, setRightType] = useState<BlockType | null>(null)

  function reset() {
    setStep("closed")
    setLeftType(null)
    setRightType(null)
  }

  function handleAddFull(type: BlockType) {
    onAdd({
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: "full-width",
      block: makeBlock(type),
    })
    reset()
  }

  function handlePickLeft(type: BlockType) {
    if (rightType) {
      // Right already picked — fire immediately
      onAdd({
        id: `sec-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: "two-column",
        left:  makeBlock(type),
        right: makeBlock(rightType),
      })
      reset()
    } else {
      setLeftType(type)
    }
  }

  function handlePickRight(type: BlockType) {
    if (leftType) {
      // Left already picked — fire immediately
      onAdd({
        id: `sec-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: "two-column",
        left:  makeBlock(leftType),
        right: makeBlock(type),
      })
      reset()
    } else {
      setRightType(type)
    }
  }

  // ── Closed state ─────────────────────────────────────────────────────────────
  if (step === "closed") {
    return isEmpty ? (
      <button
        type="button"
        onClick={() => setStep("layout")}
        className="w-full rounded-xl border-2 border-dashed border-zinc-200 py-10 text-center hover:border-zinc-400 transition-colors group"
      >
        <div className="flex justify-center mb-2.5">
          <div className="rounded-xl bg-zinc-100 p-2.5 group-hover:bg-zinc-200 transition-colors">
            <LayoutTemplate className="size-5 text-zinc-400" />
          </div>
        </div>
        <p className="text-sm font-medium text-zinc-400 group-hover:text-zinc-600 transition-colors">
          No sections yet
        </p>
        <p className="mt-1 text-xs text-zinc-300">Click to add your first section</p>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setStep("layout")}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition-colors"
      >
        <Plus className="size-3.5" />
        Add Section
      </button>
    )
  }

  // ── Open composer panel ───────────────────────────────────────────────────────
  const stepLabel: Record<Exclude<ComposerStep, "closed">, string> = {
    layout:     "Choose layout",
    "full-type": "Full Width — choose content",
    "two-col":  "Two Columns — choose types",
  }

  return (
    <div className="rounded-xl border border-zinc-300 bg-zinc-50 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        {step !== "layout" && (
          <button
            type="button"
            onClick={() => {
              setStep("layout")
              setLeftType(null)
              setRightType(null)
            }}
            className="rounded-md p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
            title="Back"
          >
            <ArrowLeft className="size-3.5" />
          </button>
        )}
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex-1">
          {stepLabel[step as Exclude<ComposerStep, "closed">]}
        </span>
        <button
          type="button"
          onClick={reset}
          className="rounded-md p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
          title="Cancel"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Step: layout choice */}
      {step === "layout" && (
        <div className="grid grid-cols-2 gap-3">
          <LayoutOption
            label="Full Width"
            description="One block, full width"
            onClick={() => setStep("full-type")}
            preview={
              <div className="flex items-center justify-center py-3">
                <div className="w-4/5 h-5 rounded bg-zinc-200 group-hover:bg-zinc-300 transition-colors" />
              </div>
            }
          />
          <LayoutOption
            label="Two Columns"
            description="Two blocks side by side"
            onClick={() => setStep("two-col")}
            preview={
              <div className="flex items-center justify-center gap-1.5 py-3">
                <div className="w-[38%] h-5 rounded bg-zinc-200 group-hover:bg-zinc-300 transition-colors" />
                <div className="w-[38%] h-5 rounded bg-zinc-200 group-hover:bg-zinc-300 transition-colors" />
              </div>
            }
          />
        </div>
      )}

      {/* Step: full-width block type */}
      {step === "full-type" && (
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map(({ type, label, icon: Icon, pill }) => (
            <button
              key={type}
              type="button"
              onClick={() => handleAddFull(type)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                pill,
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Step: two-column type pickers */}
      {step === "two-col" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ColumnPicker
            label="Left column"
            selected={leftType}
            onSelect={handlePickLeft}
          />
          <ColumnPicker
            label="Right column"
            selected={rightType}
            onSelect={handlePickRight}
          />
        </div>
      )}

      {/* Two-col hint */}
      {step === "two-col" && (
        <p className="text-xs text-zinc-400">
          {!leftType && !rightType && "Pick both sides — section adds automatically."}
          {leftType && !rightType && "Left set. Now pick the right column."}
          {!leftType && rightType && "Right set. Now pick the left column."}
        </p>
      )}
    </div>
  )
}

// ─── Layout option card ───────────────────────────────────────────────────────

function LayoutOption({
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
      className="group rounded-xl border-2 border-zinc-200 bg-white p-3 text-left hover:border-zinc-800 transition-all"
    >
      <div className="mb-2 rounded-lg bg-zinc-100">{preview}</div>
      <p className="text-sm font-semibold text-zinc-900">{label}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
    </button>
  )
}

// ─── Column type picker ───────────────────────────────────────────────────────

function ColumnPicker({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: BlockType | null
  onSelect: (type: BlockType) => void
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {BLOCK_TYPES.map(({ type, label: typeLabel, icon: Icon }) => {
          const isSelected = selected === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className={cn(
                "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                isSelected
                  ? "border-zinc-800 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50",
              )}
            >
              <Icon className="size-3 shrink-0" />
              {typeLabel}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  section: Section
  index: number
  total: number
  onMove: (id: string, direction: "up" | "down") => void
  onRemove: (id: string) => void
  onUpdateBlock: (
    sectionId: string,
    side: "block" | "left" | "right",
    content: Record<string, unknown>,
  ) => void
}

function SectionCard({ section, index, total, onMove, onRemove, onUpdateBlock }: SectionCardProps) {
  const isTwoCol = section.type === "two-column"

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 border-b border-zinc-100">
        {/* Layout badge */}
        <span className="flex items-center gap-1.5 rounded-md bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-500">
          {isTwoCol
            ? <Columns2 className="size-3" />
            : <LayoutTemplate className="size-3" />}
          {isTwoCol ? "Two Columns" : "Full Width"}
        </span>

        {/* Block type badges */}
        {!isTwoCol && section.block && <BlockBadge type={section.block.block_type} />}
        {isTwoCol && (
          <>
            {section.left  && <BlockBadge type={section.left.block_type}  />}
            <span className="text-zinc-300 text-[11px] select-none">+</span>
            {section.right && <BlockBadge type={section.right.block_type} />}
          </>
        )}

        <div className="flex-1" />

        {/* Position indicator */}
        <span className="text-[11px] text-zinc-300 font-medium select-none tabular-nums">
          {index + 1}/{total}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-0.5 ml-1">
          <button
            type="button"
            onClick={() => onMove(section.id, "up")}
            disabled={index === 0}
            className="rounded p-1 text-zinc-300 hover:text-zinc-600 disabled:opacity-20 transition-colors"
            title="Move up"
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(section.id, "down")}
            disabled={index === total - 1}
            className="rounded p-1 text-zinc-300 hover:text-zinc-600 disabled:opacity-20 transition-colors"
            title="Move down"
          >
            <ChevronDown className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(section.id)}
            className="rounded p-1 text-zinc-300 hover:text-red-500 transition-colors ml-0.5"
            title="Remove section"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!isTwoCol ? (
        <div className="p-3">
          {section.block && (
            <BlockInput
              block={section.block}
              onChange={(content) => onUpdateBlock(section.id, "block", content)}
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
          <div className="p-3 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Left</p>
            {section.left && (
              <BlockInput
                block={section.left}
                onChange={(content) => onUpdateBlock(section.id, "left", content)}
              />
            )}
          </div>
          <div className="p-3 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Right</p>
            {section.right && (
              <BlockInput
                block={section.right}
                onChange={(content) => onUpdateBlock(section.id, "right", content)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Block type badge ─────────────────────────────────────────────────────────

function BlockBadge({ type }: { type: BlockType }) {
  const { label, icon: Icon, badge } = blockMeta(type)
  return (
    <span className={cn("flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium", badge)}>
      <Icon className="size-3" />
      {label}
    </span>
  )
}

// ─── Block input dispatcher ───────────────────────────────────────────────────

function BlockInput({
  block,
  onChange,
}: {
  block: EditorBlock
  onChange: (content: Record<string, unknown>) => void
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const h = (v: any) => onChange(v as Record<string, unknown>)

  switch (block.block_type) {
    case "heading":
      return <HeadingBlock   value={block.content as { text: string; level: 1 | 2 | 3 }}  onChange={h} />
    case "paragraph":
      return <ParagraphBlock value={block.content as { text: string }}                    onChange={h} />
    case "image":
      return <ImageBlock     value={block.content as { url: string; caption?: string }}   onChange={h} />
    case "quote":
      return <QuoteBlock     value={block.content as { text: string; author?: string }}   onChange={h} />
    case "list":
      return <ListBlock      value={block.content as { items: string[] }}                 onChange={h} />
    case "video":
      return <VideoBlock     value={block.content as { url: string }}                     onChange={h} />
    case "file":
      return <FileBlock      value={block.content as unknown as FileContent}              onChange={h} />
    default:
      return null
  }
}
