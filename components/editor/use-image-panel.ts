import { useLayoutEffect, type RefObject } from "react"
import { autoUpdate, computePosition, flip, hide, offset, shift, type Placement } from "@floating-ui/dom"

export function useImagePanel(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  placement: Placement = "bottom-start",
) {
  useLayoutEffect(() => {
    const anchor = anchorRef.current
    const panel = panelRef.current
    if (!open || !anchor || !panel) return

    let active = true
    let didFocus = false
    const stop = autoUpdate(anchor, panel, () => {
      void computePosition(anchor, panel, {
        strategy: "fixed",
        placement,
        middleware: [
          offset(8),
          flip({ padding: 8, crossAxis: false }),
          shift({ padding: 8, crossAxis: true }),
          hide(),
        ],
      }).then(({ x, y, placement, middlewareData }) => {
        if (!active) return
        panel.style.left = `${x}px`
        panel.style.top = `${y}px`
        panel.style.visibility = middlewareData.hide?.referenceHidden ? "hidden" : "visible"
        panel.dataset.placement = placement
        if (!didFocus && panel.style.visibility === "visible") {
          panel.querySelector<HTMLElement>("[data-image-panel-autofocus]")?.focus({ preventScroll: true })
          didFocus = true
        }
      })
    })

    return () => {
      active = false
      stop()
    }
  }, [open, anchorRef, panelRef, placement])
}
