"use client"

import { useState, useRef, useCallback } from "react"

interface UseFileUploadOptions {
  folder: string
}

interface UploadResult {
  key: string
  url: string
}

interface UploadState {
  progress: number
  isUploading: boolean
  error: string | null
  result: UploadResult | null
}

interface UseFileUploadReturn extends UploadState {
  upload: (file: File) => Promise<UploadResult | null>
  cancelUpload: () => void
  retry: () => void
  reset: () => void
}

const INITIAL_STATE: UploadState = {
  progress: 0,
  isUploading: false,
  error: null,
  result: null,
}

export function useFileUpload({ folder }: UseFileUploadOptions): UseFileUploadReturn {
  const [state, setState] = useState<UploadState>(INITIAL_STATE)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const lastFileRef = useRef<File | null>(null)

  const upload = useCallback(
    (file: File): Promise<UploadResult | null> => {
      lastFileRef.current = file

      return new Promise(async (resolve) => {
        setState({ progress: 0, isUploading: true, error: null, result: null })

        // Step 1 — get presigned URL + key from backend
        let uploadUrl: string
        let key: string
        let fileUrl: string

        try {
          const res = await fetch("/api/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              folder,
            }),
          })

          if (!res.ok) {
            const { error } = await res.json()
            throw new Error(error ?? "Failed to get upload URL")
          }

          const data = await res.json()
          uploadUrl = data.uploadUrl
          key = data.key
          fileUrl = data.fileUrl
        } catch (err) {
          const message = err instanceof Error ? err.message : "Network error"
          setState((s) => ({ ...s, isUploading: false, error: message }))
          resolve(null)
          return
        }

        // Step 2 — upload via XHR for progress tracking + cancel support
        const xhr = new XMLHttpRequest()
        xhrRef.current = xhr

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return
          const pct = Math.round((event.loaded / event.total) * 100)
          setState((s) => ({ ...s, progress: pct }))
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const result: UploadResult = { key, url: fileUrl }
            setState({ progress: 100, isUploading: false, error: null, result })
            resolve(result)
          } else {
            setState((s) => ({
              ...s,
              isUploading: false,
              error: `Upload failed (${xhr.status})`,
            }))
            resolve(null)
          }
        }

        xhr.onerror = () => {
          setState((s) => ({ ...s, isUploading: false, error: "Network error during upload" }))
          resolve(null)
        }

        xhr.onabort = () => {
          setState((s) => ({ ...s, isUploading: false, error: "Upload cancelled", progress: 0 }))
          resolve(null)
        }

        xhr.open("PUT", uploadUrl)
        xhr.setRequestHeader("Content-Type", file.type)
        xhr.send(file)
      })
    },
    [folder],
  )

  const cancelUpload = useCallback(() => {
    xhrRef.current?.abort()
  }, [])

  const retry = useCallback(() => {
    if (lastFileRef.current) {
      upload(lastFileRef.current)
    }
  }, [upload])

  const reset = useCallback(() => {
    xhrRef.current?.abort()
    lastFileRef.current = null
    setState(INITIAL_STATE)
  }, [])

  return {
    ...state,
    upload,
    cancelUpload,
    retry,
    reset,
  }
}
