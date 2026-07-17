import type { Settings, AppState } from '../types';

const DEFAULT_SETTINGS = {
  pollingInterval: 1,
  enableNotifications: true,
};

const DEFAULT_STATE = {
  unreadCount: 0,
  lastSyncTime: '--:--:--',
  lastMessageId: null,
  connectionStatus: 'connecting',
  emailAddress: null,
  unreadEmails: [],
};

export async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      resolve(items as unknown as Settings);
    });
  });
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, () => {
      resolve();
    });
  });
}

export async function getAppState(): Promise<AppState> {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULT_STATE, (items) => {
      resolve(items as unknown as AppState);
    });
  });
}

export async function saveAppState(state: Partial<AppState>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(state, () => {
      resolve();
    });
  });
}
