import type { AppState, Credentials, Settings } from "../types"
import { AppStatus } from "../utils/constants"
import { decryptText, encryptText } from "../utils/crypto"

const DEFAULT_SETTINGS = {
  serverUrl: "",
  pollingInterval: 5,
  enableNotifications: true,
  syncOnTabChange: true,
  syncOnWindowFocus: true,
}

const DEFAULT_STATE = {
  status: AppStatus.MISSING_SERVER_URL,
  isSyncing: false,
  lastSyncTime: null,
  unreadEmails: null,
  emailAddress: null,
}

const DEFAULT_CREDENTIALS = {
  username: "",
  password: "",
  autoLoginEnabled: false,
}

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

export async function getCredentials(): Promise<Credentials> {
  const items = (await chrome.storage.local.get(
    DEFAULT_CREDENTIALS
  )) as unknown as Credentials
  if (items.password) {
    items.password = await decryptText(items.password)
  }
  return items
}

export async function saveCredentials(
  credentials: Partial<Credentials>
): Promise<void> {
  const credsToSave = { ...credentials }
  if (credsToSave.password !== undefined) {
    credsToSave.password = await encryptText(credsToSave.password)
  }
  return chrome.storage.local.set(credsToSave)
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
