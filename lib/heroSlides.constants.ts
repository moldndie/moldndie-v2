export const MAX_HERO_SLIDES = 10

/**
 * Returns true only for absolute URLs (https/http) or root-relative paths (/…).
 * Rejects bare relative paths like "hero/sample.jpg" which Next/Image cannot load.
 */
export function isValidImageUrl(url: string | null | undefined): url is string {
  if (!url || url.trim() === "") return false
  return url.startsWith("https://") || url.startsWith("http://") || url.startsWith("/")
}
