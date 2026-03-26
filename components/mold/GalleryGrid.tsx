"use client"

import { useRef, useState } from "react"
import { X, Plus, Loader2 } from "lucide-react"
import { getFileUrl } from "@/lib/utils"

export interface LocalGalleryItem {
  id?: string // undefined = new, not yet in DB
  key: string
  type: "image" | "video"
}

interface ActiveUpload {
  id: string
  name: string
  type: "image" | "video"
  progress: number
  xhr: XMLHttpRequest | null
}

interface GalleryGridProps {
  items: LocalGalleryItem[]
  onAdd: (item: LocalGalleryItem) => void
  onRemove: (index: number) => void
  onUploadingChange: (isUploading: boolean) => void
}

export function GalleryGrid({ items, onAdd, onRemove, onUploadingChange }: GalleryGridProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [activeUploads, setActiveUploads] = useState<ActiveUpload[]>([])
  const activeCountRef = useRef(0)
  // Stable refs so XHR callbacks always call the latest prop versions
  const onAddRef = useRef(onAdd)
  onAddRef.current = onAdd
  const onUploadingChangeRef = useRef(onUploadingChange)
  onUploadingChangeRef.current = onUploadingChange

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ""
    files.forEach(uploadFile)
  }

  async function uploadFile(file: File) {
    const tempId = crypto.randomUUID()
    const type: "image" | "video" = file.type.startsWith("video/") ? "video" : "image"

    activeCountRef.current++
    if (activeCountRef.current === 1) onUploadingChangeRef.current(true)

    setActiveUploads((prev) => [...prev, { id: tempId, name: file.name, type, progress: 0, xhr: null }])

    let uploadUrl: string
    let key: string
    try {
      const res = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type, folder: "molds/gallery" }),
      })
      if (!res.ok) throw new Error("Failed to get upload URL")
      const data = await res.json()
      uploadUrl = data.uploadUrl
      key = data.key
    } catch {
      finishUpload(tempId)
      return
    }

    const xhr = new XMLHttpRequest()
    setActiveUploads((prev) => prev.map((u) => (u.id === tempId ? { ...u, xhr } : u)))

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      const pct = Math.round((event.loaded / event.total) * 100)
      setActiveUploads((prev) => prev.map((u) => (u.id === tempId ? { ...u, progress: pct } : u)))
    }

    xhr.onload = () => {
      finishUpload(tempId)
      if (xhr.status >= 200 && xhr.status < 300) {
        onAddRef.current({ key, type })
      }
    }

    xhr.onerror = () => finishUpload(tempId)
    xhr.onabort = () => finishUpload(tempId)

    xhr.open("PUT", uploadUrl)
    xhr.setRequestHeader("Content-Type", file.type)
    xhr.send(file)
  }

  function finishUpload(tempId: string) {
    setActiveUploads((prev) => prev.filter((u) => u.id !== tempId))
    activeCountRef.current--
    if (activeCountRef.current === 0) onUploadingChangeRef.current(false)
  }

  const totalCount = items.length + activeUploads.length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {totalCount} item{totalCount !== 1 ? "s" : ""}
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          <Plus className="size-3.5" />
          Add Media
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      {totalCount === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 text-sm text-zinc-400 hover:border-zinc-300 hover:text-zinc-500 transition-colors"
        >
          <Plus className="size-4" />
          Upload gallery images or videos
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => (
            <div
              key={item.id ?? item.key}
              className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 cursor-pointer"
            >
              {item.type === "image" ? (
                <img
                  src={getFileUrl(item.key)}
                  alt={`Gallery item ${index + 1}`}
                  className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                />
              ) : (
                <video
                  src={getFileUrl(item.key)}
                  className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                  muted
                  preload="metadata"
                />
              )}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
              {item.type === "video" && (
                <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1 py-0.5 text-[10px] text-white">
                  VIDEO
                </span>
              )}
            </div>
          ))}

          {activeUploads.map((upload) => (
            <div
              key={upload.id}
              className="relative flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-2"
            >
              <Loader2 className="size-5 animate-spin text-zinc-400" />
              <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="h-full rounded-full bg-zinc-900 transition-all duration-200"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
              <p className="w-full truncate text-center text-[10px] text-zinc-500">{upload.name}</p>
              <button
                type="button"
                onClick={() => upload.xhr?.abort()}
                className="absolute right-1 top-1 rounded-full bg-black/40 p-0.5 text-white"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
