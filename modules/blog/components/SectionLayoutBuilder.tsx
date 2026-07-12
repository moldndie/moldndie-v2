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
import { blocksToSections, sectionsToBlocks, makeBlock, DEFAULT_COLUMN_RATIO } from "../utils/sections"
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

// Column width presets — value is the LEFT column percentage.
const RATIO_PRESETS = [50, 60, 40, 70, 30]

type Side = "left" | "right"

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

  type TwoCol = Extract<Section, { type: "two-column" }>

  // Return a copy of a two-column section with one side's blocks replaced.
  function withColumn(s: TwoCol, side: Side, blocks: EditorBlock[]): TwoCol {
    return side === "left" ? { ...s, left: blocks } : { ...s, right: blocks }
  }

  // Map over a single two-column section, applying `fn` to it.
  function mapTwoCol(sectionId: string, fn: (s: TwoCol) => Section) {
    commit(sections.map((s) => (s.id === sectionId && s.type === "two-column" ? fn(s) : s)))
  }

  function setRatio(sectionId: string, ratio: number) {
    mapTwoCol(sectionId, (s) => ({ ...s, ratio }))
  }

  function addBlockToColumn(sectionId: string, side: Side, type: BlockType) {
    mapTwoCol(sectionId, (s) => withColumn(s, side, [...s[side], makeBlock(type)]))
  }

  function removeBlockFromColumn(sectionId: string, side: Side, blockId: string) {
    mapTwoCol(sectionId, (s) => withColumn(s, side, s[side].filter((b) => b.id !== blockId)))
  }

  function moveBlockInColumn(sectionId: string, side: Side, blockId: string, direction: "up" | "down") {
    mapTwoCol(sectionId, (s) => {
      const arr = [...s[side]]
      const idx = arr.findIndex((b) => b.id === blockId)
      const swap = direction === "up" ? idx - 1 : idx + 1
      if (swap < 0 || swap >= arr.length) return s
      ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
      return withColumn(s, side, arr)
    })
  }

  function updateBlock(
    sectionId: string,
    side: "block" | Side,
    content: Record<string, unknown>,
    blockId?: string,
  ) {
    commit(
      sections.map((s) => {
        if (s.id !== sectionId) return s
        if (s.type === "full-width" && side === "block") {
          return { ...s, block: { ...s.block, content } }
        }
        if (s.type === "two-column" && (side === "left" || side === "right")) {
          return withColumn(s, side, s[side].map((b) => (b.id === blockId ? { ...b, content } : b)))
        }
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
          onSetRatio={setRatio}
          onAddBlock={addBlockToColumn}
          onRemoveBlock={removeBlockFromColumn}
          onMoveBlock={moveBlockInColumn}
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

type ComposerStep = "closed" | "layout" | "full-type"

function SectionComposer({
  isEmpty,
  onAdd,
}: {
  isEmpty: boolean
  onAdd: (section: Section) => void
}) {
  const [step, setStep] = useState<ComposerStep>("closed")

  function reset() {
    setStep("closed")
  }

  function newId() {
    return `sec-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }

  function handleAddFull(type: BlockType) {
    onAdd({ id: newId(), type: "full-width", block: makeBlock(type) })
    reset()
  }

  function handleAddTwoCol() {
    // Seed the left column with one block so the region persists (an empty
    // region would produce no blocks and vanish on the next derive).
    onAdd({
      id: newId(),
      type: "two-column",
      left: [makeBlock("paragraph")],
      right: [],
      ratio: DEFAULT_COLUMN_RATIO,
    })
    reset()
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
    layout: "Choose layout",
    "full-type": "Full Width — choose content",
  }

  return (
    <div className="rounded-xl border border-zinc-300 bg-zinc-50 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        {step !== "layout" && (
          <button
            type="button"
            onClick={() => setStep("layout")}
            className="rounded-md p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
            title="Back"
          >
            <ArrowLeft className="size-3.5" />
          </button>
        )}
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex-1">
          {stepLabel[step]}
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
            description="Two stacks side by side"
            onClick={handleAddTwoCol}
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

// ─── Section card ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  section: Section
  index: number
  total: number
  onMove: (id: string, direction: "up" | "down") => void
  onRemove: (id: string) => void
  onUpdateBlock: (sectionId: string, side: "block" | Side, content: Record<string, unknown>, blockId?: string) => void
  onSetRatio: (sectionId: string, ratio: number) => void
  onAddBlock: (sectionId: string, side: Side, type: BlockType) => void
  onRemoveBlock: (sectionId: string, side: Side, blockId: string) => void
  onMoveBlock: (sectionId: string, side: Side, blockId: string, direction: "up" | "down") => void
}

function SectionCard({
  section, index, total, onMove, onRemove, onUpdateBlock,
  onSetRatio, onAddBlock, onRemoveBlock, onMoveBlock,
}: SectionCardProps) {
  const isTwoCol = section.type === "two-column"

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-zinc-50 border-b border-zinc-100">
        {/* Layout badge */}
        <span className="flex items-center gap-1.5 rounded-md bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-500">
          {isTwoCol
            ? <Columns2 className="size-3" />
            : <LayoutTemplate className="size-3" />}
          {isTwoCol ? "Two Columns" : "Full Width"}
        </span>

        {/* Full-width block type badge */}
        {section.type === "full-width" && <BlockBadge type={section.block.block_type} />}

        {/* Ratio switch (two-column only) */}
        {section.type === "two-column" && (
          <div className="flex items-center gap-0.5 rounded-md border border-zinc-200 bg-white p-0.5">
            {RATIO_PRESETS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onSetRatio(section.id, r)}
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums transition-colors",
                  section.ratio === r
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:bg-zinc-100",
                )}
              >
                {r}/{100 - r}
              </button>
            ))}
          </div>
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
      {section.type === "full-width" ? (
        <div className="p-3">
          <BlockInput
            block={section.block}
            onChange={(content) => onUpdateBlock(section.id, "block", content)}
          />
        </div>
      ) : (
        <div
          className="flex flex-col divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 sm:grid"
          style={{ gridTemplateColumns: `${section.ratio}fr ${100 - section.ratio}fr` }}
        >
          <ColumnEditor
            side="left"
            blocks={section.left}
            sectionId={section.id}
            onUpdate={onUpdateBlock}
            onAdd={onAddBlock}
            onRemove={onRemoveBlock}
            onMove={onMoveBlock}
          />
          <ColumnEditor
            side="right"
            blocks={section.right}
            sectionId={section.id}
            onUpdate={onUpdateBlock}
            onAdd={onAddBlock}
            onRemove={onRemoveBlock}
            onMove={onMoveBlock}
          />
        </div>
      )}
    </div>
  )
}

// ─── Single editable column (a continuous stack of blocks) ─────────────────────

function ColumnEditor({
  side, blocks, sectionId, onUpdate, onAdd, onRemove, onMove,
}: {
  side: Side
  blocks: EditorBlock[]
  sectionId: string
  onUpdate: (sectionId: string, side: "block" | Side, content: Record<string, unknown>, blockId?: string) => void
  onAdd: (sectionId: string, side: Side, type: BlockType) => void
  onRemove: (sectionId: string, side: Side, blockId: string) => void
  onMove: (sectionId: string, side: Side, blockId: string, direction: "up" | "down") => void
}) {
  const [picking, setPicking] = useState(false)

  return (
    <div className="p-3 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
        {side === "left" ? "Left" : "Right"}
      </p>

      {blocks.length === 0 && !picking && (
        <p className="text-[11px] text-zinc-300 italic">Empty column</p>
      )}

      {blocks.map((block, idx) => (
        <div key={block.id} className="rounded-lg border border-zinc-200 bg-zinc-50/40">
          <div className="flex items-center gap-1 px-2 py-1 border-b border-zinc-100">
            <BlockBadge type={block.block_type} />
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => onMove(sectionId, side, block.id, "up")}
              disabled={idx === 0}
              className="rounded p-0.5 text-zinc-300 hover:text-zinc-600 disabled:opacity-20 transition-colors"
              title="Move up"
            >
              <ChevronUp className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => onMove(sectionId, side, block.id, "down")}
              disabled={idx === blocks.length - 1}
              className="rounded p-0.5 text-zinc-300 hover:text-zinc-600 disabled:opacity-20 transition-colors"
              title="Move down"
            >
              <ChevronDown className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(sectionId, side, block.id)}
              className="rounded p-0.5 text-zinc-300 hover:text-red-500 transition-colors ml-0.5"
              title="Remove block"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
          <div className="p-2">
            <BlockInput
              block={block}
              onChange={(content) => onUpdate(sectionId, side, content, block.id)}
            />
          </div>
        </div>
      ))}

      {picking ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Add block
            </span>
            <button
              type="button"
              onClick={() => setPicking(false)}
              className="rounded p-0.5 text-zinc-400 hover:text-zinc-700 transition-colors"
              title="Cancel"
            >
              <X className="size-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onAdd(sectionId, side, type)
                  setPicking(false)
                }}
                className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 transition-all"
              >
                <Icon className="size-3 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="w-full flex items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-200 py-1.5 text-[11px] font-medium text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <Plus className="size-3" />
          Add to {side}
        </button>
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
