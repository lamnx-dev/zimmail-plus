import { getAppState, getSettings, saveAppState } from "../storage/settings"
import { formatTime } from "../utils/date"
import { getAuthToken, getMailboxInfo, getRecentMessages } from "./api"
import { setErrorBadge, setUnreadBadge } from "./badge"
import { showMailNotification } from "./notification"

let retryCount = 0
const RETRY_BACKOFFS = [5000, 10000, 20000, 30000, 60000] // milliseconds
let retryTimeoutId: ReturnType<typeof setTimeout> | null = null

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function syncMailbox(_force: boolean = false): Promise<void> {
  if (retryTimeoutId) {
    clearTimeout(retryTimeoutId)
    retryTimeoutId = null
  }

  try {
    const authToken = await getAuthToken()
    if (!authToken) {
      console.warn("Chưa đăng nhập (thiếu cookie ZM_AUTH_TOKEN)")
      await saveAppState({
        connectionStatus: "disconnected",
        lastSyncTime: formatTime(),
        emailAddress: null,
        unreadEmails: [],
      })
      setErrorBadge()
      return
    }

    // Update state to connecting if we were disconnected
    const state = await getAppState()
    if (state.connectionStatus === "disconnected") {
      await saveAppState({ connectionStatus: "connecting" })
    }

    const { unreadCount, emailAddress, unreadEmails } = await getMailboxInfo()

    const recentMessages = await getRecentMessages(15)
    const recentIds = recentMessages.map((m) => m.id)

    const localData = await new Promise<{ seenIds?: string[] }>((resolve) => {
      chrome.storage.local.get(["seenIds"], (items) => resolve(items))
    })
    const seenIds = localData.seenIds || []

    const isFirstRun = seenIds.length === 0 && state.lastMessageId === null

    const newMessages = recentMessages.filter((m) => !seenIds.includes(m.id))

    // Keep up to 100 seen IDs to prevent growth
    const updatedSeenIds = Array.from(new Set([...recentIds, ...seenIds])).slice(0, 100)
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ seenIds: updatedSeenIds }, () => resolve())
    })

    if (!isFirstRun && newMessages.length > 0) {
      const settings = await getSettings()
      if (settings.enableNotifications) {
        // Notify in reverse order (oldest first)
        for (let i = newMessages.length - 1; i >= 0; i--) {
          showMailNotification(newMessages[i])
        }
      }
    }

    setUnreadBadge(unreadCount)
    await saveAppState({
      unreadCount,
      lastSyncTime: formatTime(),
      connectionStatus: "connected",
      emailAddress: emailAddress || state.emailAddress,
      lastMessageId: recentIds[0] || null,
      unreadEmails: unreadEmails || [],
    })

    retryCount = 0
  } catch (error) {
    console.error("Lỗi khi đồng bộ mailbox:", error)

    await saveAppState({
      connectionStatus: "disconnected",
      lastSyncTime: formatTime(),
      unreadEmails: [],
    })
    setErrorBadge()

    scheduleRetry()
  }
}

function scheduleRetry(): void {
  if (retryCount >= RETRY_BACKOFFS.length) {
    console.warn("Đã đạt giới hạn số lần retry. Sẽ chờ lần sync định kỳ tiếp theo.")
    return
  }

  const delay = RETRY_BACKOFFS[retryCount]
  retryCount++

  retryTimeoutId = setTimeout(() => {
    syncMailbox().catch((err) => console.error("Lỗi trong hàm retry:", err))
  }, delay)
}
