"use client"

import { useRef, type PointerEvent } from "react"
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { GripVertical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { articleImageWidth, type ImagePlacement } from "./article-image"

export function ArticleImageView({ editor, node, selected, getPos, updateAttributes, deleteNode }: NodeViewProps) {
  const figureRef = useRef<HTMLDivElement>(null)
  const resize = useRef<{ startX: number; startWidth: number; availableWidth: number } | null>(null)
  const { src, alt, caption, widthPercent } = node.attrs
  const placement: ImagePlacement = node.attrs.placement ?? "block"
  const width = articleImageWidth(widthPercent, placement)
  const widthLimit = placement === "block" ? 100 : 80

  function selectImage() {
    const pos = getPos()
    if (typeof pos === "number") editor.commands.setNodeSelection(pos)
  }

  function startResize(event: PointerEvent<HTMLDivElement>) {
    const figure = figureRef.current
    const container = figure?.parentElement?.parentElement
    if (!figure || !container || event.button !== 0) return
    const padding = getComputedStyle(container)
    const availableWidth = container.clientWidth - parseFloat(padding.paddingLeft) - parseFloat(padding.paddingRight)
    if (availableWidth <= 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    resize.current = { startX: event.clientX, startWidth: figure.offsetWidth, availableWidth }
  }

  function resizeWidth(event: PointerEvent<HTMLDivElement>) {
    const drag = resize.current
    if (!drag) return null
    const scale = placement === "right" ? -1 : placement === "block" ? 2 : 1
    const delta = (event.clientX - drag.startX) * scale
    return articleImageWidth(Math.max(1, (drag.startWidth + delta) / drag.availableWidth * 100), placement)
  }

  function finishResize(event: PointerEvent<HTMLDivElement>, commit: boolean) {
    const nextWidth = resizeWidth(event)
    resize.current = null
    figureRef.current?.parentElement?.style.removeProperty("--article-image-live-width")
    if (commit && nextWidth !== null) updateAttributes({ widthPercent: nextWidth })
  }

  return (
    <NodeViewWrapper ref={figureRef} className="relative" contentEditable={false}>
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element -- article images can use external URLs */}
        <img src={src} alt={alt ?? ""} title={node.attrs.title ?? undefined} data-drag-handle onClick={selectImage} />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
      {selected && (
        <>
          <span data-drag-handle title="Drag image to move it" className="article-image-grip">
            <GripVertical className="size-4" aria-hidden="true" />
          </span>
          <div
            title="Drag to resize image"
            aria-hidden="true"
            className="article-image-resize"
            onPointerDown={startResize}
            onPointerMove={(event) => {
              const nextWidth = resizeWidth(event)
              if (nextWidth !== null) {
                figureRef.current?.parentElement?.style.setProperty("--article-image-live-width", `${nextWidth}%`)
              }
            }}
            onPointerUp={(event) => finishResize(event, true)}
            onLostPointerCapture={(event) => finishResize(event, false)}
          />
          <div className="article-image-controls">
            <div className="flex flex-wrap items-center gap-1.5">
              <Select
                aria-label="Image placement"
                value={placement}
                className="h-7 w-auto max-w-full text-xs"
                onChange={(event) => {
                  const nextPlacement = event.target.value as ImagePlacement
                  const nextWidth = nextPlacement !== "block" && width > 80 ? 50 : width
                  updateAttributes({ placement: nextPlacement, widthPercent: nextWidth })
                }}
              >
                <option value="block">On its own line</option>
                <option value="left">Image left, wrap text</option>
                <option value="right">Image right, wrap text</option>
              </Select>
              <Button type="button" size="icon-xs" variant="ghost-danger" title="Remove image" aria-label="Remove image" onClick={deleteNode}>
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
            <label className="flex items-center gap-2 text-xs">
              Width
              <input
                type="range"
                className="min-w-0 flex-1"
                min={15}
                max={widthLimit}
                value={width}
                onChange={(event) => updateAttributes({ widthPercent: event.target.valueAsNumber })}
              />
              {width}%
            </label>
            <Input
              aria-label="Image caption"
              placeholder="Caption (optional)"
              className="h-7 text-xs"
              value={caption ?? ""}
              onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault() }}
              onChange={(event) => updateAttributes({ caption: event.target.value })}
            />
            <Input
              aria-label="Image description for screen readers"
              placeholder="Alt text"
              className="h-7 text-xs"
              value={alt ?? ""}
              onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault() }}
              onChange={(event) => updateAttributes({ alt: event.target.value })}
            />
          </div>
        </>
      )}
    </NodeViewWrapper>
  )
}
