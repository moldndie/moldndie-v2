"use client"

import { X } from "lucide-react"
import { CroppableFileUploadField } from "@/components/forms/CroppableFileUploadField"
import { FileUploadField } from "@/components/forms/FileUploadField"
import { FilePreview } from "@/components/forms/FilePreview"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const labelCls = "block text-xs font-semibold text-zinc-700 mb-1"

interface Props {
  /** R2 folder prefix, e.g. "services" -> services/images, services/videos */
  folder: string
  /** Remounts the upload fields when a different record is loaded */
  formKey: string
  images: string[]
  videos: string[]
  videoUrls: string[]
  onImages: (v: string[]) => void
  onVideos: (v: string[]) => void
  onVideoUrls: (v: string[]) => void
  onUploadingChange: (uploading: boolean) => void
}

/** Multi-image + multi-video + external-link editor shared by services and examples. */
export function MediaListFields({
  folder, formKey, images, videos, videoUrls,
  onImages, onVideos, onVideoUrls, onUploadingChange,
}: Props) {
  return (
    <>
      <div>
        <label className={labelCls}>Images</label>
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            {images.map((key, i) => (
              <FilePreview
                key={`${key}-${i}`}
                value={key}
                onClear={() => onImages(images.filter((_, j) => j !== i))}
              />
            ))}
          </div>
        )}
        <CroppableFileUploadField
          key={`${formKey}-img-${images.length}`}
          folder={`${folder}/images`}
          aspect={4 / 3}
          label="Click to add an image (4:3)"
          onUploadSuccess={({ key }) => onImages([...images, key])}
          onUploadingChange={onUploadingChange}
        />
        <p className="text-xs text-zinc-400 mt-1">
          Add as many as you like. The first image is the cover.
        </p>
      </div>

      <div>
        <label className={labelCls}>Video files</label>
        {videos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            {videos.map((key, i) => (
              <FilePreview
                key={`${key}-${i}`}
                value={key}
                onClear={() => onVideos(videos.filter((_, j) => j !== i))}
              />
            ))}
          </div>
        )}
        <FileUploadField
          key={`${formKey}-vid-${videos.length}`}
          folder={`${folder}/videos`}
          accept="video/*"
          label="Click to add a video"
          onUploadSuccess={({ key }) => onVideos([...videos, key])}
          onUploadingChange={onUploadingChange}
        />
      </div>

      <div>
        <label className={labelCls}>Video links</label>
        <div className="space-y-2">
          {videoUrls.map((u, i) => (
            <div key={i} className="flex gap-2">
              <Input
                className="h-auto py-2"
                value={u}
                onChange={(e) => onVideoUrls(videoUrls.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder="https://youtube.com/watch?v=…"
              />
              <Button
                variant="ghost-danger" size="icon-sm" type="button"
                aria-label="Remove link"
                onClick={() => onVideoUrls(videoUrls.filter((_, j) => j !== i))}
                className="text-zinc-400"
              >
                <X size={14} />
              </Button>
            </div>
          ))}
          <Button
            variant="link" size="xs" type="button"
            onClick={() => onVideoUrls([...videoUrls, ""])}
            className="h-auto px-0 font-semibold"
          >
            + Add video link
          </Button>
        </div>
      </div>
    </>
  )
}
