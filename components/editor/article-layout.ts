import DragHandle from "@tiptap/extension-drag-handle"
import type { Slice } from "@tiptap/pm/model"
import { NodeSelection } from "@tiptap/pm/state"
import type { EditorView } from "@tiptap/pm/view"
import { articleImageWidth } from "./article-image"

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

export function dropImageBesideText(view: EditorView, event: DragEvent, slice: Slice, moved: boolean) {
  const image = slice.content.firstChild
  const { selection, doc } = view.state
  if (!moved || image?.type.name !== "image" || slice.content.childCount !== 1 ||
    slice.openStart || slice.openEnd || !selection.content().eq(slice)) return false

  const bounds = view.dom.getBoundingClientRect()
  if (bounds.width < 500) return false
  const relativeX = (event.clientX - bounds.left) / bounds.width
  const placement = relativeX < 0.25 ? "left" : relativeX > 0.75 ? "right" : null
  if (!placement) return false

  const hit = view.posAtCoords({ left: event.clientX, top: event.clientY })
  if (!hit) return false
  const target = doc.resolve(hit.pos)
  if (target.depth !== 1 || !target.parent.isTextblock) return false

  const width = articleImageWidth(image.attrs.widthPercent, image.attrs.placement ?? "block")
  const wrappedImage = image.type.create({
    ...image.attrs,
    placement,
    widthPercent: width > 80 ? 50 : width,
  })
  const tr = view.state.tr.deleteSelection()
  const pos = tr.mapping.map(target.before(1))
  tr.insert(pos, wrappedImage).setSelection(NodeSelection.create(tr.doc, pos))
  view.focus()
  view.dispatch(tr.setMeta("uiEvent", "drop"))
  return true
}
