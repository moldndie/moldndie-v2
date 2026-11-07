"use client"

import { Node } from "@tiptap/core"
import Document from "@tiptap/extension-document"
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react"
import { Paperclip, Trash2, Video } from "lucide-react"
import { getFileUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { ArticleMediaReplacement, ArticleWidthControl, type ArticleUploadResult } from "./ArticleMediaControls"
import { ArticleVideoPlayer } from "./ArticleVideoPlayer"
import {
  getVideoPlacement, getVideoWidthPercent, isUploadedArticleVideo, MAX_VIDEO_WIDTH_PERCENT,
  MAX_WRAPPED_VIDEO_WIDTH_PERCENT, MIN_VIDEO_WIDTH_PERCENT,
} from "./article-video"
import "./article-video.css"

// Media cards are top-level only. Saving writes them back as ordinary blog
// blocks, so the existing public renderer still handles playback and downloads.
export const ArticleDocument = Document.extend({ content: "(block | articleMedia)+" })

const mediaFields = ["kind", "url", "file_path", "file_name", "file_type", "file_size", "widthPercent", "placement"] as const

function ArticleMediaView({ editor, node, selected, getPos, updateAttributes, deleteNode }: NodeViewProps) {
  const { kind, url, file_name, file_path, file_type, widthPercent } = node.attrs
  const isVideo = kind === "video"
  const isUploadedVideo = isUploadedArticleVideo(node.attrs)
  const placement = getVideoPlacement(node.attrs.placement)
  const videoWidth = getVideoWidthPercent(widthPercent, placement) ?? (placement === "block" ? MAX_VIDEO_WIDTH_PERCENT : 50)
  const Icon = isVideo || isUploadedVideo ? Video : Paperclip

  function replaceVideoFile({ key, file }: ArticleUploadResult) {
    if (editor.isDestroyed) return
    const pos = getPos()
    const current = typeof pos === "number" ? editor.state.doc.nodeAt(pos) : null
    if (current?.type !== node.type || current.attrs.kind !== kind ||
      current.attrs.file_path !== file_path || current.attrs.url !== url) {
      throw new Error("The original video changed. Select it and try again.")
    }
    updateAttributes({
      kind: "file", url: null, file_path: key, file_name: file.name, file_type: file.type, file_size: file.size,
    })
  }

  return (
    <NodeViewWrapper
      contentEditable={false}
      className="mx-auto my-3 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 text-sm"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div data-drag-handle className="flex min-w-0 flex-1 cursor-grab items-center gap-3">
          <Icon className="size-5 shrink-0 text-zinc-500" aria-hidden="true" />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-zinc-500">
              {isUploadedVideo ? "Uploaded video" : isVideo ? "Video embed" : "Attachment"}
            </div>
            <div className="truncate text-zinc-900" title={isVideo ? url : file_name}>
              {isVideo ? url : file_name || "Download file"}
            </div>
          </div>
        </div>
        {selected && (
          isUploadedVideo || isVideo ? (
            <Button type="button" size="icon-xs" variant="ghost-danger" title="Remove video" aria-label="Remove video" onClick={deleteNode}>
              <Trash2 aria-hidden="true" />
            </Button>
          ) : (
            <span className="ml-auto truncate text-xs text-zinc-500">Delete to remove</span>
          )
        )}
      </div>
      {isUploadedVideo && (
        <>
          <div className="max-w-sm px-3 pb-2">
            <Select
              aria-label="Video placement"
              value={placement}
              className="h-7 w-full min-w-0 text-xs"
              onChange={(event) => {
                const next = getVideoPlacement(event.currentTarget.value)
                const nextWidth = next !== "block" && videoWidth > MAX_WRAPPED_VIDEO_WIDTH_PERCENT ? 50 : videoWidth
                updateAttributes({ placement: next, widthPercent: nextWidth })
              }}
            >
              <option value="block">On its own line</option>
              <option value="left">Video left, wrap text</option>
              <option value="right">Video right, wrap text</option>
            </Select>
          </div>
          <div className="max-w-sm px-3 pb-2">
            <ArticleWidthControl
              label="Video width"
              min={MIN_VIDEO_WIDTH_PERCENT}
              max={placement === "block" ? MAX_VIDEO_WIDTH_PERCENT : MAX_WRAPPED_VIDEO_WIDTH_PERCENT}
              width={videoWidth}
              onChange={(next) => updateAttributes({ widthPercent: next })}
            />
          </div>
        </>
      )}
      {(isUploadedVideo || isVideo) && (
        <div className="max-w-sm px-3 pb-3">
          <ArticleMediaReplacement
            kind="video"
            onFile={replaceVideoFile}
            onUrl={isVideo ? (url) => updateAttributes({ url }) : undefined}
          />
        </div>
      )}
      {isUploadedVideo && <ArticleVideoPlayer src={getFileUrl(file_path)} type={file_type} label={file_name} preload="none" />}
    </NodeViewWrapper>
  )
}

export const ArticleMedia = Node.create({
  name: "articleMedia",
  group: "articleMedia",
  atom: true,
  draggable: true,
  addAttributes() {
    return Object.fromEntries(mediaFields.map((field) => [field, {
      default: null,
      parseHTML: (element: HTMLElement) => element.getAttribute(`data-${field.toLowerCase()}`),
      renderHTML: (attrs: Record<string, unknown>) => ({ [`data-${field.toLowerCase()}`]: attrs[field] }),
    }]))
  },
  parseHTML() {
    return [{ tag: "div[data-article-media]" }]
  },
  renderHTML({ node, HTMLAttributes }) {
    const label = node.attrs.kind === "video" ? node.attrs.url : node.attrs.file_name
    return ["div", { ...HTMLAttributes, "data-article-media": "" }, String(label ?? "")]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ArticleMediaView, {
      attrs: ({ node }): Record<string, string> => {
        if (!isUploadedArticleVideo(node.attrs)) return {}
        const placement = getVideoPlacement(node.attrs.placement)
        const width = getVideoWidthPercent(node.attrs.widthPercent, placement) ?? (placement === "block" ? MAX_VIDEO_WIDTH_PERCENT : 50)
        return { "data-article-video": placement, style: `--article-video-width: ${width}%` }
      },
    })
  },
})
