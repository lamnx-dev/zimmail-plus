import { getAppState, getSettings, saveAppState } from "../storage/settings"
import { ConnectionStatus } from "../utils/constants"
import { formatTime } from "../utils/date"
import { getUnreadEmails } from "./api"
import { setErrorBadge, setUnreadBadge, setUnreadTooltip } from "./badge"
import { showMailNotification } from "./notification"

export async function pollUnreadMails(): Promise<void> {
  try {
    const settings = await getSettings()
    if (!settings.serverUrl) {
      await saveAppState({
        connectionStatus: ConnectionStatus.DISCONNECTED,
        lastSyncTime: formatTime(),
        unreadEmails: [],
      })
      setErrorBadge()
      setUnreadTooltip([])
      return
    }

    const state = await getAppState()
    if (state.connectionStatus === ConnectionStatus.DISCONNECTED) {
      await saveAppState({ connectionStatus: ConnectionStatus.CONNECTING })
    }

    const unreadEmails = await getUnreadEmails()
    const localData = await new Promise<{ seenIds?: string[] }>((resolve) => {
      chrome.storage.local.get(["seenIds"], (items) => resolve(items))
    })

    const unreadIds = unreadEmails.map((m) => m.id)
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
      if (settings.enableNotifications) {
        for (let i = newMessages.length - 1; i >= 0; i--) {
          showMailNotification(newMessages[i])
        }
      }
    }

    setUnreadBadge(unreadEmails.length)
    setUnreadTooltip(unreadEmails)
    await saveAppState({
      unreadCount: unreadEmails.length,
      lastSyncTime: formatTime(),
      connectionStatus: ConnectionStatus.CONNECTED,
      unreadEmails,
    })
  } catch (error) {
    await saveAppState({
      connectionStatus: ConnectionStatus.DISCONNECTED,
      lastSyncTime: formatTime(),
      unreadEmails: [],
    })
    setErrorBadge()
    setUnreadTooltip([])

    throw error
  }
}
