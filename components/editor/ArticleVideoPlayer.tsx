interface ArticleVideoPlayerProps {
  src: string
  type: string
  label?: string
  preload?: "none" | "metadata"
}

export function ArticleVideoPlayer({ src, type, label, preload = "metadata" }: ArticleVideoPlayerProps) {
  return (
    <video key={src} controls playsInline preload={preload} aria-label={label || "Article video"} className="block w-full">
      <source src={src} type={type} />
    </video>
  )
}
