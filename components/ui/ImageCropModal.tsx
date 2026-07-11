"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import Cropper from "react-easy-crop"
import type { Area, Point } from "react-easy-crop"
import { X, Check, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageCropModalProps {
  imageSrc: string
  aspect: number
  onCancel: () => void
  onCropDone: (croppedFile: File) => void
  originalFileName?: string
}

const PADDING_EPSILON = 0.5 // px tolerance for float rounding in react-easy-crop's pixel math

function hasPadding(pixelCrop: Area, naturalWidth: number, naturalHeight: number): boolean {
  return (
    pixelCrop.x < -PADDING_EPSILON ||
    pixelCrop.y < -PADDING_EPSILON ||
    pixelCrop.x + pixelCrop.width > naturalWidth + PADDING_EPSILON ||
    pixelCrop.y + pixelCrop.height > naturalHeight + PADDING_EPSILON
  )
}

async function getCroppedImg(
  image: HTMLImageElement,
  pixelCrop: Area,
  originalFileName: string,
): Promise<File> {
  // Crop extends beyond the source image bounds (e.g. image zoomed out to fit a
  // wider/taller frame) — export as PNG so that empty space is transparent
  // instead of an opaque fill color.
  const outputType: "image/jpeg" | "image/png" = hasPadding(pixelCrop, image.naturalWidth, image.naturalHeight)
    ? "image/png"
    : "image/jpeg"

  const canvas = document.createElement("canvas")
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext("2d")!

  if (outputType === "image/jpeg") {
    // JPEG has no alpha channel — fill white as a defensive fallback (shouldn't
    // be reachable since this branch means there's no padding to fill)
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  // PNG: canvas default is transparent — no fill needed

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )

  const ext = outputType === "image/png" ? "png" : "jpg"
  const quality = outputType === "image/jpeg" ? 0.92 : undefined

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas is empty"))),
      outputType,
      quality,
    )
  })

  return new File(
    [blob],
    originalFileName.replace(/\.[^.]+$/, `.${ext}`),
    { type: outputType },
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function ImageCropModal({
  imageSrc,
  aspect,
  onCancel,
  onCropDone,
  originalFileName = "image",
}: ImageCropModalProps) {
  const ABSOLUTE_MIN_ZOOM = 0.1
  const MAX_ZOOM = 3

  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [zoomInitialized, setZoomInitialized] = useState(false)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  // Load the source image once to read its natural dimensions
  useEffect(() => {
    setZoomInitialized(false)
    const image = new window.Image()
    image.onload = () => setImageEl(image)
    image.src = imageSrc
  }, [imageSrc])

  // "Fit" zoom: the level at which react-easy-crop shows the entire image
  // inside the crop frame (like object-fit: contain) instead of its default
  // zoom=1 "cover" behavior. react-easy-crop scales zoom=1 to exactly cover
  // the crop box, so the contain/cover ratio below is relative to that baseline.
  const fitZoom = useMemo(() => {
    if (!imageEl) return 1
    const imageAspect = imageEl.naturalWidth / imageEl.naturalHeight
    const ratio = Math.min(imageAspect, aspect) / Math.max(imageAspect, aspect)
    return clamp(ratio, ABSOLUTE_MIN_ZOOM, 1)
  }, [imageEl, aspect])

  // Default to showing the whole image — as wide/uncropped as possible —
  // once we know its dimensions, instead of an arbitrary fixed zoom.
  useEffect(() => {
    if (imageEl && !zoomInitialized) {
      setZoom(fitZoom)
      setZoomInitialized(true)
    }
  }, [imageEl, fitZoom, zoomInitialized])

  const minZoom = imageEl ? fitZoom : ABSOLUTE_MIN_ZOOM

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const willBeTransparent = imageEl && croppedAreaPixels
    ? hasPadding(croppedAreaPixels, imageEl.naturalWidth, imageEl.naturalHeight)
    : false

  async function handleDone() {
    if (!croppedAreaPixels || !imageEl) return
    setProcessing(true)
    try {
      const file = await getCroppedImg(imageEl, croppedAreaPixels, originalFileName)
      onCropDone(file)
    } catch {
      onCancel()
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h2 className="text-base font-semibold text-zinc-900">Crop Image</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative w-full bg-zinc-900" style={{ height: 480 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            minZoom={minZoom}
            maxZoom={MAX_ZOOM}
            aspect={aspect}
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom control */}
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-3">
          <ZoomOut size={14} className="text-zinc-400 shrink-0" />
          <input
            type="range"
            min={minZoom}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <ZoomIn size={14} className="text-zinc-400 shrink-0" />
        </div>

        {/* Hint */}
        <p className="px-5 pt-3 text-[11px] text-zinc-400 text-center">
          The full image is shown by default · Drag or zoom in to crop tighter
          {willBeTransparent && (
            <span className="ml-1 text-blue-500">· Empty space will be saved transparent</span>
          )}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-5 py-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
            Cancel
          </Button>
          <Button type="button" onClick={handleDone} disabled={processing || !imageEl}>
            <Check className="size-4 mr-1.5" />
            {processing ? "Processing…" : "Apply Crop"}
          </Button>
        </div>
      </div>
    </div>
  )
}
