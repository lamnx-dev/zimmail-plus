import { useEffect, useRef } from "react"

interface ShadowContentProps {
  html?: string
  text?: string
}

export default function ShadowContent({ html, text }: ShadowContentProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!html || !containerRef.current) return

    let shadowRoot = containerRef.current.shadowRoot
    if (!shadowRoot) {
      shadowRoot = containerRef.current.attachShadow({ mode: "open" })
    }

    shadowRoot.innerHTML = html.trim()
  }, [html])

  if (html) {
    return <div ref={containerRef} />
  }

  return (
    <div className="text-sm wrap-break-word whitespace-pre-wrap">
      {text || "(Thư không có nội dung)"}
    </div>
  )
}
