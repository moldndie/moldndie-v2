"use client"

import { useState, useCallback } from "react"
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

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<File> {
  const image = new window.Image()
  image.src = imageSrc
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = reject
  })

  const canvas = document.createElement("canvas")
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("Canvas is empty")); return }
      resolve(new File([blob], "cropped.jpg", { type: "image/jpeg" }))
    }, "image/jpeg", 0.92)
  })
}

export function ImageCropModal({
  imageSrc,
  aspect,
  onCancel,
  onCropDone,
  originalFileName = "image",
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  async function handleDone() {
    if (!croppedAreaPixels) return
    setProcessing(true)
    try {
      const file = await getCroppedImg(imageSrc, croppedAreaPixels)
      const namedFile = new File([file], originalFileName.replace(/\.[^.]+$/, ".jpg"), {
        type: "image/jpeg",
      })
      onCropDone(namedFile)
    } catch {
      // fallback: cancel
      onCancel()
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
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
        <div className="relative w-full bg-zinc-900" style={{ height: 320 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
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
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <ZoomIn size={14} className="text-zinc-400 shrink-0" />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-5 py-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
            Cancel
          </Button>
          <Button type="button" onClick={handleDone} disabled={processing}>
            <Check className="size-4 mr-1.5" />
            {processing ? "Processing…" : "Apply Crop"}
          </Button>
        </div>
      </div>
    </div>
  )
}
