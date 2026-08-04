import type { AppState, Secrets, Settings } from "../types"
import { AppStatus, SUMMARY_CACHE_PREFIX } from "../utils/constants"
import { decryptText, encryptText } from "../utils/crypto"

export const DEFAULT_SETTINGS = {
  serverUrl: "",
  pollingInterval: 5,
  enableNotifications: true,
  syncOnTabChange: true,
  syncOnWindowFocus: true,
  username: "",
  autoLoginEnabled: false,
} as const satisfies Settings

const DEFAULT_STATE = {
  status: AppStatus.MISSING_SERVER_URL,
  isSyncing: false,
  lastSyncTime: null,
  unreadEmails: null,
  emailAddress: null,
} as const satisfies AppState

const DEFAULT_SECRETS = {
  password: "",
  aiApiKey: "",
} as const satisfies Secrets

export async function getSettings(): Promise<Settings> {
  const items = await chrome.storage.local.get(DEFAULT_SETTINGS)
  return items as unknown as Settings
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  return chrome.storage.local.set(settings)
}

export async function getAppState(): Promise<AppState> {
  const items = await chrome.storage.local.get(DEFAULT_STATE)
  return items as unknown as AppState
}

export async function saveAppState(state: Partial<AppState>): Promise<void> {
  return chrome.storage.local.set(state)
}

export async function getSecrets(): Promise<Secrets> {
  const secrets = (await chrome.storage.local.get(
    DEFAULT_SECRETS
  )) as unknown as Secrets

  const decrypted: Partial<Secrets> = {}

  if (secrets.password) {
    decrypted.password = await decryptText(secrets.password)
  } else {
    decrypted.password = ""
  }

  if (secrets.aiApiKey) {
    decrypted.aiApiKey = await decryptText(secrets.aiApiKey)
  } else {
    decrypted.aiApiKey = ""
  }

  return decrypted as Secrets
}

export async function saveSecrets(secrets: Partial<Secrets>): Promise<void> {
  const toSave: Record<string, string> = {}

  if (secrets.password !== undefined) {
    toSave.password = secrets.password
      ? await encryptText(secrets.password)
      : ""
  }

  if (secrets.aiApiKey !== undefined) {
    toSave.aiApiKey = secrets.aiApiKey
      ? await encryptText(secrets.aiApiKey)
      : ""
  }

  if (Object.keys(toSave).length > 0) {
    await chrome.storage.local.set(toSave)
  }
}

export async function resetAppState(): Promise<void> {
  const settings = await getSettings()
  const status = !settings.serverUrl
    ? AppStatus.MISSING_SERVER_URL
    : AppStatus.DISCONNECTED
  await saveAppState({
    ...DEFAULT_STATE,
    status,
  })
}

export async function clearAllSummaryCache(): Promise<number> {
  const allItems = await chrome.storage.local.get(null)
  const keysToRemove = Object.keys(allItems).filter((key) =>
    key.startsWith(SUMMARY_CACHE_PREFIX)
  )
  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove)
  }
  return keysToRemove.length
}
