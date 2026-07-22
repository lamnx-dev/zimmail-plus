import type { Settings, AppState, Credentials } from '../types';
import { ConnectionStatus } from '../utils/constants';

const DEFAULT_SETTINGS = {
  pollingInterval: 5,
  enableNotifications: true,
  syncOnTabChange: true,
  syncOnWindowFocus: true,
};

const DEFAULT_STATE = {
  unreadCount: 0,
  lastSyncTime: '--:--:--',
  connectionStatus: ConnectionStatus.CONNECTING,
  emailAddress: null,
  unreadEmails: [],
};

const DEFAULT_CREDENTIALS = {
  username: '',
  password: '',
  autoLoginEnabled: false,
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

export async function getCredentials(): Promise<Credentials> {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULT_CREDENTIALS, (items) => {
      resolve(items as unknown as Credentials);
    });
  });
}

export async function saveCredentials(credentials: Partial<Credentials>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(credentials, () => {
      resolve();
    });
  });
}

export async function resetAppState(): Promise<void> {
  await saveAppState({
    ...DEFAULT_STATE,
    connectionStatus: ConnectionStatus.DISCONNECTED,
  });
}

