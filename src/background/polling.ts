import { getAppState, getSettings, saveAppState } from "../storage/settings"
import { ConnectionStatus } from "../utils/constants"
import { formatTime } from "../utils/date"
import { getErrorMessage } from "../utils/error"
import { getUnreadEmails } from "./api"
import { setErrorBadge, setUnreadBadge, setUnreadTooltip } from "./badge"
import { showMailNotification } from "./notification"

export async function pollUnreadMails(): Promise<void> {
  try {
    const state = await getAppState()
    if (state.connectionStatus === ConnectionStatus.DISCONNECTED) {
      await saveAppState({ connectionStatus: ConnectionStatus.CONNECTING })
    }

    const { unreadCount, unreadEmails } = await getUnreadEmails()
    const unreadIds = unreadEmails.map((m) => m.id)

    const localData = await new Promise<{ seenIds?: string[] }>((resolve) => {
      chrome.storage.local.get(["seenIds"], (items) => resolve(items))
    })
    const seenIds = localData.seenIds || []

    const isFirstRun = localData.seenIds === undefined

    // Detect new messages from unread list
    const newMessages = unreadEmails.filter((m) => !seenIds.includes(m.id))

    // Keep up to 100 seen IDs to prevent growth
    const updatedSeenIds = Array.from(new Set([...unreadIds, ...seenIds])).slice(0, 100)
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ seenIds: updatedSeenIds }, () => resolve())
    })

    if (!isFirstRun && newMessages.length > 0) {
      const settings = await getSettings()
      if (settings.enableNotifications) {
        for (let i = newMessages.length - 1; i >= 0; i--) {
          showMailNotification(newMessages[i])
        }
      }
    }

    setUnreadBadge(unreadCount)
    setUnreadTooltip(unreadEmails)
    await saveAppState({
      unreadCount,
      lastSyncTime: formatTime(),
      connectionStatus: ConnectionStatus.CONNECTED,
      unreadEmails: unreadEmails || [],
    })
  } catch (error) {
    console.error("Đồng bộ mailbox thất bại:", getErrorMessage(error))

    await saveAppState({
      connectionStatus: ConnectionStatus.DISCONNECTED,
      lastSyncTime: formatTime(),
      unreadEmails: [],
    })
    setErrorBadge()
    setUnreadTooltip([])
  }
}
