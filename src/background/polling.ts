import { getAppState, getSettings, saveAppState } from "../storage/settings"
import type { MailMessage } from "../types"
import { ConnectionStatus, SEEN_IDS_STORAGE_KEY } from "../utils/constants"
import { formatTime } from "../utils/date"
import { getUnreadEmails } from "./api"
import { setErrorBadge, setUnreadBadge, setUnreadTooltip } from "./badge"
import { showMailNotification } from "./notification"

// --- Helper Functions ---

async function getSeenIds(): Promise<string[] | undefined> {
  const items = await chrome.storage.local.get([SEEN_IDS_STORAGE_KEY])
  return items[SEEN_IDS_STORAGE_KEY] as string[] | undefined
}

async function updateSeenIds(unreadIds: string[], currentSeenIds: string[] = []): Promise<void> {
  const updatedSeenIds = Array.from(new Set([...unreadIds, ...currentSeenIds])).slice(0, 100)
  await chrome.storage.local.set({ [SEEN_IDS_STORAGE_KEY]: updatedSeenIds })
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

    const unreadEmails = await getUnreadEmails()
    const rawSeenIds = await getSeenIds()
    const isFirstRun = rawSeenIds === undefined
    const seenIds = rawSeenIds || []

    const unreadIds = unreadEmails.map((m) => m.id)
    const newMessages = unreadEmails.filter((m) => !seenIds.includes(m.id))

    await updateSeenIds(unreadIds, seenIds)

    if (!isFirstRun && newMessages.length > 0) {
      notifyNewMessages(newMessages, settings.enableNotifications)
    }

    await updateConnectedState(unreadEmails)
  } catch (error) {
    await updateDisconnectedState()
    throw error
  }
}
