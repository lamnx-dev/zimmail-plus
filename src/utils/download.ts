import { BASE_URL } from "./constants"

/**
 * Downloads a mail attachment from Zimbra server.
 * Must be executed in a browser/page context (has access to document and window).
 */
export async function downloadAttachment(messageId: string, part: string, filename: string): Promise<void> {
  const downloadUrl = `${BASE_URL}/service/home/~/?id=${messageId}&part=${part}`
  const response = await fetch(downloadUrl, { credentials: "include" })

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
  }

  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}
