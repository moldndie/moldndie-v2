import DragHandle from "@tiptap/extension-drag-handle"
import type { Slice } from "@tiptap/pm/model"
import { NodeSelection } from "@tiptap/pm/state"
import type { EditorView } from "@tiptap/pm/view"
import { articleImageWidth } from "./article-image"
import { getVideoPlacement, getVideoWidthPercent, isUploadedArticleVideo } from "./article-video"

export const ArticleDragHandle = DragHandle.configure({
  computePositionConfig: { placement: "left-start", strategy: "fixed" },
  render() {
    const handle = document.createElement("div")
    handle.className = "article-block-grip"
    handle.title = "Drag to move this block"
    handle.setAttribute("aria-hidden", "true")
    handle.textContent = "⠿"
    return handle
  },
})

export function dropMediaBesideText(view: EditorView, event: DragEvent, slice: Slice, moved: boolean) {
  const media = slice.content.firstChild
  const { selection, doc } = view.state
  // ProseMirror can drag a node without changing the current text selection.
  const draggedNode = (view.dragging as { node?: NodeSelection } | null)?.node
  const source = draggedNode ?? selection
  if (!moved || !media || slice.content.childCount !== 1 ||
    slice.openStart || slice.openEnd || !source.content().eq(slice)) return false
  const isImage = media.type.name === "image"
  if (!isImage && !(media.type.name === "articleMedia" && isUploadedArticleVideo(media.attrs))) return false

  const bounds = view.dom.getBoundingClientRect()
  if (bounds.width < 500) return false
  const relativeX = (event.clientX - bounds.left) / bounds.width
  const placement = relativeX < 0.25 ? "left" : relativeX > 0.75 ? "right" : null
  if (!placement) return false

  const hit = view.posAtCoords({ left: event.clientX, top: event.clientY })
  if (!hit) return false
  const target = doc.resolve(hit.pos)
  if (target.depth !== 1 || !target.parent.isTextblock) return false

  const width = isImage
    ? articleImageWidth(media.attrs.widthPercent, media.attrs.placement ?? "block")
    : getVideoWidthPercent(media.attrs.widthPercent, getVideoPlacement(media.attrs.placement)) ?? 100
  const wrapped = media.type.create({
    ...media.attrs,
    placement,
    widthPercent: width > 80 ? 50 : width,
  })
  const tr = view.state.tr.delete(source.from, source.to)
  const pos = tr.mapping.map(target.before(1))
  tr.insert(pos, wrapped).setSelection(NodeSelection.create(tr.doc, pos))
  view.focus()
  view.dispatch(tr.setMeta("uiEvent", "drop"))
  return true
}
