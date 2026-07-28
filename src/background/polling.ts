import { getAppState, getSettings, saveAppState } from "../storage/settings"
import type { MailMessage } from "../types"
import { AppStatus, LAST_SEEN_EMAIL_TIMESTAMP_KEY } from "../utils/constants"
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

async function updateMissingServerUrlState(): Promise<void> {
  await saveAppState({
    status: AppStatus.MISSING_SERVER_URL,
    lastSyncTime: new Date().toISOString(),
    unreadEmails: null,
    emailAddress: null,
  })
  setErrorBadge()
  setUnreadTooltip([])
}

async function updateDisconnectedState(): Promise<void> {
  await saveAppState({
    status: AppStatus.DISCONNECTED,
    lastSyncTime: new Date().toISOString(),
    unreadEmails: null,
    emailAddress: null,
  })
  setErrorBadge()
  setUnreadTooltip([])
}

async function updateConnectedState(unreadEmails: MailMessage[]): Promise<void> {
  await saveAppState({
    status: AppStatus.CONNECTED,
    lastSyncTime: new Date().toISOString(),
    unreadEmails,
  })
  setUnreadBadge(unreadEmails.length)
  setUnreadTooltip(unreadEmails)
}

// --- Main Polling Function ---

export async function pollUnreadMails(): Promise<void> {
  try {
    const [settings, currentState] = await Promise.all([getSettings(), getAppState()])

    if (!settings.serverUrl) {
      await updateMissingServerUrlState()
      return
    }

    if (currentState.status !== AppStatus.SYNCING) {
      await saveAppState({ status: AppStatus.SYNCING })
    }

    const [rawUnreadMessages, lastSeenTimestamp] = await Promise.all([getUnreadRawMessages(), getLastSeenTimestamp()])
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
