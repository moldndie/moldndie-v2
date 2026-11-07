"use client"

import { createContext, useContext, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { UploadResult } from "@/services/upload.service"

export type ArticleUploadKind = "image" | "video" | "attachment"
export type ArticleUploadResult = UploadResult & { file: File }
type ArticleUpload = (file: File, kind: ArticleUploadKind, apply: (result: ArticleUploadResult) => void) => Promise<void>

export const ArticleUploadContext = createContext<ArticleUpload | null>(null)

export function isArticleMediaUrl(value: string) {
  try {
    const protocol = new URL(value).protocol
    return protocol === "http:" || protocol === "https:"
  } catch {
    return false
  }
}

export function ArticleWidthControl({ label, width, min, max, onChange }: {
  label: string
  width: number
  min: number
  max: number
  onChange: (width: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)

  function commitWidth() {
    const parsed = draft?.trim() ? Number(draft) : NaN
    if (Number.isFinite(parsed)) {
      const next = Math.max(min, Math.min(max, Math.round(parsed)))
      if (next !== width) onChange(next)
    }
    setDraft(null)
  }

  return (
    <div className="grid gap-1 text-xs font-medium text-zinc-600">
      <span>{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        <input
          aria-label={label}
          aria-valuetext={`${width}%`}
          type="range"
          min={min}
          max={max}
          value={width}
          className="min-w-8 flex-1"
          onChange={(event) => {
            setDraft(null)
            onChange(event.currentTarget.valueAsNumber)
          }}
        />
        <div className="relative w-14 max-w-full">
          <Input
            aria-label={`${label} percentage`}
            type="number"
            inputMode="numeric"
            value={draft ?? width}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onBlur={commitWidth}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                event.currentTarget.blur()
              }
              if (event.key === "Escape") {
                event.preventDefault()
                setDraft(null)
              }
            }}
            className="h-7 px-1.5 pr-4 text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">%</span>
        </div>
      </div>
    </div>
  )
}

export function ArticleMediaReplacement({ kind, onFile, onUrl }: {
  kind: "image" | "video"
  onFile: (result: ArticleUploadResult) => void
  onUrl?: (url: string) => void
}) {
  const upload = useContext(ArticleUploadContext)
  const fileInput = useRef<HTMLInputElement>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [url, setUrl] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  function replaceUrl() {
    const next = url.trim()
    if (!onUrl || !isArticleMediaUrl(next)) {
      setError("Enter a valid HTTP or HTTPS URL.")
      return
    }
    onUrl(next)
    setError("")
    setUrl("")
    setShowOptions(false)
  }

  async function replaceFile(file: File) {
    if (!upload) return
    setPending(true)
    setError("")
    try {
      await upload(file, kind, onFile)
      setShowOptions(false)
      setUrl("")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Replacement failed. Try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="xs"
        className="w-fit max-w-full whitespace-normal"
        disabled={pending}
        aria-expanded={onUrl ? showOptions : undefined}
        onClick={() => {
          if (onUrl) setShowOptions(!showOptions)
          else fileInput.current?.click()
        }}
      >
        {pending ? "Replacing…" : `Replace ${kind}`}
      </Button>
      <input
        ref={fileInput}
        type="file"
        accept={kind === "image" ? "image/*" : ".mp4,.webm,video/mp4,video/webm"}
        aria-label={`Choose replacement ${kind} file`}
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ""
          if (file) void replaceFile(file)
        }}
      />
      {onUrl && showOptions && (
        <>
          <Button type="button" size="xs" variant="outline" disabled={pending} onClick={() => fileInput.current?.click()}>
            Choose file
          </Button>
          <div className="flex flex-wrap items-center gap-1">
            <Input
              aria-label={`Replacement ${kind} URL`}
              inputMode="url"
              placeholder="Or paste a URL"
              value={url}
              disabled={pending}
              className="h-7 min-w-24 flex-1 px-2 text-xs"
              onChange={(event) => { setUrl(event.currentTarget.value); setError("") }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  replaceUrl()
                }
              }}
            />
            <Button type="button" size="xs" disabled={pending || !url.trim()} onClick={replaceUrl}>Apply</Button>
          </div>
        </>
      )}
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
