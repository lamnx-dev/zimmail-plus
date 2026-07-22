import { BASE_URL } from "./constants"

export function openZimbraInbox(): void {
  chrome.tabs.create({ url: BASE_URL })
  if (typeof window !== "undefined" && window.close) {
    window.close()
  }
}

export function openZimbraEmail(messageId: string): void {
  const url = messageId ? `${BASE_URL}/#1?id=${encodeURIComponent(messageId)}` : BASE_URL
  chrome.tabs.create({ url })
  if (typeof window !== "undefined" && window.close) {
    window.close()
  }
}
