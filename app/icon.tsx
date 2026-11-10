import { ImageResponse } from "next/og"
import { getSiteSettings } from "@/services/siteSettings.service"

export const size = { width: 48, height: 48 }
export const contentType = "image/png"
export const dynamic = "force-dynamic"

async function getUploadedIcon() {
  const { logo_favicon } = await getSiteSettings()
  const base = process.env.NEXT_PUBLIC_R2_BASE_URL
  if (!logo_favicon || !base) return null

  const url = new URL(logo_favicon)
  const uploads = new URL(`${base.replace(/\/$/, "")}/branding/`)
  if (url.protocol !== "https:" || url.origin !== uploads.origin || !url.pathname.startsWith(uploads.pathname)) return null

  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(4000),
  })
  const type = response.headers.get("content-type")
  const maxBytes = 4 * 1024 * 1024
  if (!response.ok || (type !== "image/png" && type !== "image/jpeg")) return null
  if (Number(response.headers.get("content-length")) > maxBytes) return null
  const data = await response.arrayBuffer()
  if (data.byteLength > maxBytes) return null
  return `data:${type};base64,${Buffer.from(data).toString("base64")}`
}

function renderIcon(src: string | null) {
  return new ImageResponse(
    <div style={{
      display: "flex",
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      background: "white",
      borderRadius: 7,
    }}>
      {src ? (
        // next/og renders this data URL to PNG on the server.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width={46} height={46} style={{ objectFit: "contain" }} />
      ) : (
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="#7C2020" strokeWidth="3" />
          <circle cx="16" cy="16" r="7" stroke="#7C2020" strokeWidth="2.5" />
          <circle cx="16" cy="16" r="3" fill="#7C2020" />
        </svg>
      )}
    </div>,
    size,
  )
}

export default async function Icon() {
  try {
    const src = await getUploadedIcon()
    if (src) {
      const png = await renderIcon(src).arrayBuffer()
      return new Response(png, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=60, s-maxage=60",
        },
      })
    }
  } catch {
    // Keep the favicon available during a storage or settings outage.
  }

  const png = await renderIcon(null).arrayBuffer()
  return new Response(png, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  })
}
