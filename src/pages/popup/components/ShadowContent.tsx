import { useEffect, useRef } from "react"

interface ShadowContentProps {
  html?: string
  text?: string
}

export default function ShadowContent({ html, text }: ShadowContentProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let shadowRoot = containerRef.current.shadowRoot
    if (!shadowRoot) {
      shadowRoot = containerRef.current.attachShadow({ mode: "open" })
    }

    if (html) {
      const styledHtml = `<style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 13px;
          line-height: 1.5;
          color: #0f172a;
          word-break: break-word;
        }
        img {
          max-width: 100%;
          height: auto;
        }
        a {
          color: #0057a8;
        }
      </style>${html.trim()}`
      shadowRoot.innerHTML = styledHtml
    } else {
      const plainTextHtml = `<style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 13px;
          line-height: 1.5;
          color: #0f172a;
          word-break: break-word;
        }
        .text-content {
          white-space: pre-wrap;
        }
      </style><div class="text-content">${(text || "(Thư không có nội dung)").trim()}</div>`
      shadowRoot.innerHTML = plainTextHtml
    }
  }, [html, text])

  return <div ref={containerRef} />
}
