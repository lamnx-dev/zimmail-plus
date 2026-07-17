import { BASE_URL } from "./constants"

export function openZimbraInbox(): void {
  chrome.tabs.create({ url: BASE_URL })
  if (typeof window !== "undefined" && window.close) {
    window.close()
  }
}
