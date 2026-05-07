/**
 * Upload abstraction layer — all uploads target Cloudflare R2.
 *
 * Client-side uploads use presigned URLs via /api/upload-url.
 * Server-side utilities use the S3-compatible R2 client directly.
 *
 * Supported types: images, videos, PDFs, CAD files (.stp, .iges, .dwg),
 * ZIP/RAR archives, and other binary assets.
 */

export type UploadFolder =
  | "blogs/covers"
  | "blogs/files"
  | "events/images"
  | "molds/previews"
  | "molds/files"
  | "courses/thumbnails"
  | "courses/videos"
  | "courses/pdfs"
  | "courses/cad"
  | "courses/archives"
  | "suppliers/images"
  | "ads/images"
  | string

export interface UploadResult {
  key: string
  url: string
}

/**
 * Request a presigned R2 upload URL from the backend.
 * Returns the R2 object key and the direct file URL.
 */
export async function getPresignedUploadUrl(
  folder: UploadFolder,
  fileName: string,
  fileType: string,
): Promise<{ uploadUrl: string; key: string; fileUrl: string }> {
  const res = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, fileName, fileType }),
  })
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "Upload service unavailable" }))
    throw new Error(error ?? "Failed to get upload URL")
  }
  return res.json()
}

/**
 * Upload a file to R2 directly via presigned URL.
 * Returns the resulting R2 key and public URL.
 */
export async function uploadFileToR2(
  folder: UploadFolder,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const { uploadUrl, key, fileUrl } = await getPresignedUploadUrl(folder, file.name, file.type)

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload failed (${xhr.status})`))
    }
    xhr.onerror  = () => reject(new Error("Network error during upload"))
    xhr.onabort  = () => reject(new Error("Upload cancelled"))

    xhr.open("PUT", uploadUrl)
    xhr.setRequestHeader("Content-Type", file.type)
    xhr.send(file)
  })

  return { key, url: fileUrl }
}

/**
 * Derive the R2 public URL for a stored key.
 */
export function getR2Url(key: string): string {
  return `${process.env.NEXT_PUBLIC_R2_BASE_URL}/${key}`
}
