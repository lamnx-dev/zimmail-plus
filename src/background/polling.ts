import { getAppState, getSettings, saveAppState } from "../storage/settings"
import type { MailMessage } from "../types"
import { ConnectionStatus, LAST_SEEN_EMAIL_TIMESTAMP_KEY } from "../utils/constants"
import { formatTime } from "../utils/date"
import { parseMailMessage } from "../utils/zimbra"
import { getLatestEmailDate, getUnreadRawMessages } from "./api"
import { setErrorBadge, setUnreadBadge, setUnreadTooltip } from "./badge"
import { showMailNotification } from "./notification"

// --- Helper Functions ---

async function getLastSeenTimestamp(): Promise<number | undefined> {
  const items = await chrome.storage.local.get([LAST_SEEN_EMAIL_TIMESTAMP_KEY])
  return items[LAST_SEEN_EMAIL_TIMESTAMP_KEY] as number | undefined
}

async function updateLastSeenTimestamp(timestamp: number): Promise<void> {
  await chrome.storage.local.set({ [LAST_SEEN_EMAIL_TIMESTAMP_KEY]: timestamp })
}

function notifyNewMessages(newMessages: MailMessage[], enableNotifications: boolean): void {
  if (!enableNotifications) return
  for (let i = newMessages.length - 1; i >= 0; i--) {
    showMailNotification(newMessages[i])
  }
}

async function updateDisconnectedState(): Promise<void> {
  await saveAppState({
    connectionStatus: ConnectionStatus.DISCONNECTED,
    lastSyncTime: formatTime(),
    unreadEmails: null,
  })
  setErrorBadge()
  setUnreadTooltip([])
}

async function updateConnectedState(unreadEmails: MailMessage[]): Promise<void> {
  await saveAppState({
    connectionStatus: ConnectionStatus.CONNECTED,
    lastSyncTime: formatTime(),
    unreadEmails,
  })
  setUnreadBadge(unreadEmails.length)
  setUnreadTooltip(unreadEmails)
}

// --- Main Polling Function ---

export async function pollUnreadMails(): Promise<void> {
  try {
    const settings = await getSettings()
    if (!settings.serverUrl) {
      await updateDisconnectedState()
      return
    }

    const state = await getAppState()
    if (state.connectionStatus === ConnectionStatus.DISCONNECTED) {
      await saveAppState({ connectionStatus: ConnectionStatus.CONNECTING })
    }

    const rawUnreadMessages = await getUnreadRawMessages()
    const lastSeenTimestamp = await getLastSeenTimestamp()
    const isFirstRun = lastSeenTimestamp === undefined

    if (isFirstRun) {
      const latestDateNumber = await getLatestEmailDate()
      const initialTimestamp = latestDateNumber || 0
      await updateLastSeenTimestamp(initialTimestamp)
    } else {
      const newRawMessages = rawUnreadMessages.filter((m) => !!m.d && m.d > lastSeenTimestamp)

      if (newRawMessages.length > 0) {
        const newParsedMessages = newRawMessages.map(parseMailMessage)
        notifyNewMessages(newParsedMessages, settings.enableNotifications)
      }

      const latestUnreadMsg = rawUnreadMessages[0]
      if (latestUnreadMsg?.d && latestUnreadMsg.d > lastSeenTimestamp) {
        await updateLastSeenTimestamp(latestUnreadMsg.d)
      }
    }

    const parsedUnreadEmails = rawUnreadMessages.map(parseMailMessage)
    await updateConnectedState(parsedUnreadEmails)
  } catch (error) {
    await updateDisconnectedState()
    throw error
  }
}
