import { getSettings } from "../storage/settings"

async function openOrFocusTab(
  targetUrl: string,
  baseUrl: string
): Promise<void> {
  try {
    const origin = new URL(baseUrl).origin
    const matchPattern = `${origin}/*`
    const [existingTab] = await chrome.tabs.query({ url: matchPattern })

    if (existingTab && existingTab.id !== undefined) {
      await chrome.tabs.update(existingTab.id, { url: targetUrl, active: true })
      if (existingTab.windowId !== undefined) {
        await chrome.windows.update(existingTab.windowId, { focused: true })
      }
    } else {
      await chrome.tabs.create({ url: targetUrl })
    }
  } catch (error) {
    console.error("Mở/chuyển tab thất bại, mở tab mới:", error)
    await chrome.tabs.create({ url: targetUrl })
  }
}

export async function openZimbraInbox(): Promise<void> {
  const settings = await getSettings()
  const baseUrl = settings.serverUrl
  if (baseUrl) {
    await openOrFocusTab(baseUrl, baseUrl)
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
    const url = new URL(baseUrl)

    if (messageId) {
      url.searchParams.set("id", messageId)
    }

    const finalUrl = url.toString()
    await openOrFocusTab(finalUrl, baseUrl)
  } else {
    chrome.runtime.openOptionsPage()
  }
  if (typeof window !== "undefined" && window.close) {
    window.close()
  }
}
