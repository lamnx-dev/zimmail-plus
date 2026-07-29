import { getSettings } from "../storage/settings"

export async function openZimbraInbox(): Promise<void> {
  const settings = await getSettings()
  const baseUrl = settings.serverUrl
  if (baseUrl) {
    chrome.tabs.create({ url: baseUrl })
  } else {
    chrome.runtime.openOptionsPage()
  }
  if (typeof window !== "undefined" && window.close) {
    window.close()
  }
}

export async function openZimbraEmail(messageId: string): Promise<void> {
  const settings = await getSettings()
  const baseUrl = settings.serverUrl
  if (baseUrl) {
    const url = messageId
      ? `${baseUrl}/#1?id=${encodeURIComponent(messageId)}`
      : baseUrl
    chrome.tabs.create({ url })
  } else {
    chrome.runtime.openOptionsPage()
  }
  if (typeof window !== "undefined" && window.close) {
    window.close()
  }
}
