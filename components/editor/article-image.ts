import Image from "@tiptap/extension-image"

export type ImagePlacement = "block" | "left" | "right"

export function articleImageWidth(width: unknown, placement: ImagePlacement) {
  const parsed = Number(width)
  const max = placement === "block" ? 100 : 80
  const fallback = placement === "block" ? 100 : 50
  return Math.round(Math.max(15, Math.min(max, parsed > 0 ? parsed : fallback)))
}

export function articleImageLayout(attrs: Record<string, unknown>) {
  const placement = attrs.placement === "left" || attrs.placement === "right" ? attrs.placement : "block"
  const width = articleImageWidth(attrs.widthPercent, placement)
  const pixels = Number(attrs.width)
  const size = attrs.widthPercent == null && placement === "block" && pixels > 0 ? `${pixels}px` : `${width}%`
  return {
    "data-article-image": placement,
    style: `--article-image-width: ${size}`,
  }
}

// Keep the original image node name so saved documents and pasted images still work.
export const ArticleImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      placement: { default: null, rendered: false },
      widthPercent: { default: null, rendered: false },
      caption: { default: null, rendered: false },
    }
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-article-image]",
        getAttrs: (figure) => {
          const image = figure.querySelector<HTMLImageElement>("img[src]")
          const src = image?.getAttribute("src")
          if (!image || !src || src.toLowerCase().startsWith("data:")) return false
          return {
            src,
            alt: image.getAttribute("alt"),
            title: image.getAttribute("title"),
            width: image.getAttribute("width"),
            placement: figure.dataset.articleImage,
            widthPercent: figure.dataset.widthPercent || null,
            caption: figure.querySelector("figcaption")?.textContent ?? null,
          }
        },
      },
      ...(this.parent?.() ?? []),
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const { placement, widthPercent, caption } = node.attrs
    if (!placement && widthPercent == null && !caption) {
      return ["img", HTMLAttributes]
    }

    const figure = {
      ...articleImageLayout(node.attrs),
      "data-width-percent": widthPercent ?? "",
    }
    const image = ["img", { ...HTMLAttributes, alt: HTMLAttributes.alt ?? "" }] as const
    return caption ? ["figure", figure, image, ["figcaption", caption]] : ["figure", figure, image]
  },
})
