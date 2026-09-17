"use client"

import { useEffect, useRef, useState } from "react"

// Posts the page height to the parent so the iframe grows with its content
// instead of showing its own scrollbar.
// The style stops 100vh layouts from growing forever as the iframe grows.
const RESIZE_SCRIPT = `<style>html,body{min-height:0!important;height:auto!important}</style><script>(function(){
  function send(){ parent.postMessage({ mndHeight: document.documentElement.scrollHeight }, "*") }
  new ResizeObserver(send).observe(document.documentElement);
  addEventListener("load", send);
})()</script>`

/**
 * Renders an admin-uploaded calculator page. The sandbox has no
 * allow-same-origin, so the code runs on an opaque origin: it can't read the
 * site's cookies, session or DOM.
 */
export default function CustomCalculatorFrame({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(800)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== ref.current?.contentWindow) return
      const h = Number(e.data?.mndHeight)
      if (h > 0) setHeight(h)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  // <base target="_top">: plain links open in the real tab, not inside the frame.
  const withBase = html.replace(/<head[^>]*>/i, (m) => `${m}<base target="_top">`)
  const srcDoc = withBase.includes("</body>") ? withBase.replace("</body>", `${RESIZE_SCRIPT}</body>`) : withBase + RESIZE_SCRIPT

  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-popups allow-forms allow-modals allow-downloads allow-top-navigation-by-user-activation"
      style={{ height }}
      className="block w-full border-0"
    />
  )
}
