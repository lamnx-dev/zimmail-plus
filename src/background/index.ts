import {
  getAppState,
  getSettings,
  resetAppState,
  saveAppState,
} from "../storage/settings"
import type { MailMessageDetail, MessageResponse } from "../types"
import {
  Action,
  AlarmName,
  AUTH_TOKEN_COOKIE_NAME,
  getSummaryCacheKey,
  SUMMARIZE_EMAIL_PORT,
} from "../utils/constants"
import { getErrorMessage } from "../utils/error"
import { summarizeEmailStream, testAiConnection } from "./ai"
import {
  flagEmail,
  getMessageDetail,
  getUserEmailFromToken,
  loginAndSaveToken,
  markAsRead,
  markAsUnread,
  resetReauthStatus,
  searchEmails,
  unflagEmail,
  verifyServerUrl,
} from "./api"
import { setErrorBadge } from "./badge"
import { setupNotificationListeners } from "./notification"
import { pollUnreadMails } from "./polling"

// --- State ---

let isUserOnWebMail = false
let lastUrlTransitionSyncTime = 0
const MIN_URL_TRANSITION_SYNC_INTERVAL_MS = 5000

// --- Helper Functions ---

function setupAlarm(intervalInMinutes: number): void {
  chrome.alarms.clear(AlarmName.MAILBOX_SYNC, () => {
    chrome.alarms.create(AlarmName.MAILBOX_SYNC, {
      periodInMinutes: intervalInMinutes,
    })
  })
}

async function syncUserEmail(): Promise<void> {
  try {
    const [currentState, emailAddress] = await Promise.all([
      getAppState(),
      getUserEmailFromToken(),
    ])

    if (currentState.emailAddress !== emailAddress) {
      await saveAppState({ emailAddress })
    }
  } catch (error) {
    await saveAppState({ emailAddress: null })
    throw error
  }
}

async function syncMailAndUser(): Promise<void> {
  await pollUnreadMails()
  await syncUserEmail()
}

async function handleUrlTransition(
  url: string | undefined,
  type: "tab" | "window"
): Promise<void> {
  const { serverUrl, syncOnTabChange, syncOnWindowFocus } = await getSettings()

  if (!serverUrl) return

  if (type === "tab" && !syncOnTabChange) return
  if (type === "window" && !syncOnWindowFocus) return

  const isOnMail = !!(url && serverUrl && url.startsWith(serverUrl))

  if (isOnMail !== isUserOnWebMail) {
    isUserOnWebMail = isOnMail

    const now = Date.now()
    if (now - lastUrlTransitionSyncTime < MIN_URL_TRANSITION_SYNC_INTERVAL_MS) {
      return
    }
    lastUrlTransitionSyncTime = now

    await pollUnreadMails()
  }
}

async function checkInitialActiveTab(): Promise<void> {
  try {
    const { serverUrl } = await getSettings()

    if (!serverUrl) return

    const [activeTab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    })
    if (activeTab && activeTab.url && activeTab.url.startsWith(serverUrl)) {
      isUserOnWebMail = true
    }
  } catch (error) {
    console.error("Kiểm tra active tab lúc khởi động thất bại:", error)
  }
}

// --- Extension Initialization & Lifecycle ---

setupNotificationListeners()
checkInitialActiveTab()

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    chrome.runtime.openOptionsPage()
    return
  }

  try {
    const settings = await getSettings()
    if (settings.serverUrl) {
      setupAlarm(settings.pollingInterval)
      await syncMailAndUser()
    }
  } catch (error) {
    console.error(
      "Đồng bộ khi cài đặt/cập nhật thất bại:",
      getErrorMessage(error)
    )
  }
})

chrome.runtime.onStartup.addListener(async () => {
  try {
    const settings = await getSettings()
    if (settings.serverUrl) {
      setupAlarm(settings.pollingInterval)
      await syncMailAndUser()
    }
  } catch (error) {
    console.error(
      "Đồng bộ khi khởi động trình duyệt thất bại:",
      getErrorMessage(error)
    )
  }
})

// --- Alarms, Storage & Cookie Listeners ---

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === AlarmName.MAILBOX_SYNC) {
    try {
      await pollUnreadMails()
    } catch (error) {
      console.error(
        "Đồng bộ email chưa đọc từ alarm thất bại:",
        getErrorMessage(error)
      )
    }
  }
})

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== "local") return

  if (changes.username || changes.password || changes.autoLoginEnabled) {
    resetReauthStatus()
  }

  if (changes.pollingInterval) {
    const newInterval =
      typeof changes.pollingInterval.newValue === "number"
        ? changes.pollingInterval.newValue
        : 5

    setupAlarm(newInterval)
  }

  if (changes.serverUrl) {
    const oldUrl = changes.serverUrl.oldValue
    const newUrl = changes.serverUrl.newValue

    if (oldUrl !== newUrl) {
      try {
        if (typeof newUrl !== "string" || !newUrl.trim()) {
          chrome.alarms.clear(AlarmName.MAILBOX_SYNC)
          await resetAppState()
          setErrorBadge()
        } else {
          const settings = await getSettings()
          setupAlarm(settings.pollingInterval)
          await syncMailAndUser()
        }
      } catch (error) {
        console.error(
          "Đồng bộ khi thay đổi Server URL thất bại:",
          getErrorMessage(error)
        )
      }
    }
  }
})

chrome.cookies.onChanged.addListener(async (changeInfo) => {
  try {
    const { serverUrl } = await getSettings()

    if (!serverUrl) return

    const domain = new URL(serverUrl).hostname

    if (
      changeInfo.cookie.name === AUTH_TOKEN_COOKIE_NAME &&
      changeInfo.cookie.domain.includes(domain)
    ) {
      if (changeInfo.removed) {
        await resetAppState()
        setErrorBadge()
      } else {
        await syncMailAndUser()
      }
    }
  } catch (error) {
    console.error("Xử lý thay đổi cookie thất bại:", getErrorMessage(error))
  }
})

// --- Tab & Window Event Listeners ---

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId)
    await handleUrlTransition(tab.url, "tab")
  } catch (error) {
    console.error("Xử lý sự kiện chuyển tab thất bại:", getErrorMessage(error))
  }
})

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) {
    try {
      await handleUrlTransition(changeInfo.url, "tab")
    } catch (error) {
      console.error(
        "Xử lý sự kiện cập nhật URL tab thất bại:",
        getErrorMessage(error)
      )
    }
  }
})

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  try {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      await handleUrlTransition(undefined, "window")
      return
    }
    const [activeTab] = await chrome.tabs.query({ active: true, windowId })
    if (activeTab) {
      await handleUrlTransition(activeTab.url, "window")
    }
  } catch (error) {
    console.error(
      "Xử lý sự kiện chuyển cửa sổ thất bại:",
      getErrorMessage(error)
    )
  }
})

// --- Message Handlers ---

chrome.runtime.onMessage.addListener(
  (
    message,
    _sender,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendResponse: (response: MessageResponse<any>) => void
  ) => {
    if (message.action === Action.VERIFY_SERVER_URL) {
      ;(async () => {
        try {
          await verifyServerUrl(message.serverUrl)
          sendResponse({ success: true })
        } catch (error) {
          sendResponse({ success: false, error: getErrorMessage(error) })
        }
      })()
      return true
    }

    if (message.action === Action.VERIFY_CREDENTIALS) {
      ;(async () => {
        try {
          await loginAndSaveToken(
            message.serverUrl,
            message.username,
            message.password
          )
          sendResponse({ success: true })
        } catch (error) {
          sendResponse({ success: false, error: getErrorMessage(error) })
        }
      })()
      return true
    }

    if (message.action === Action.TEST_AI_CONNECTION) {
      ;(async () => {
        try {
          await testAiConnection(message.apiKey)
          sendResponse({ success: true })
        } catch (error) {
          sendResponse({ success: false, error: getErrorMessage(error) })
        }
      })()
      return true
    }

    if (message.action === Action.REFRESH) {
      ;(async () => {
        try {
          resetReauthStatus()
          await syncMailAndUser()
          sendResponse({ success: true })
        } catch (error) {
          sendResponse({ success: false, error: getErrorMessage(error) })
        }
      })()
      return true
    }

    if (message.action === Action.MARK_AS_READ) {
      ;(async () => {
        try {
          await markAsRead(message.messageId)
          await pollUnreadMails()
          sendResponse({ success: true })
        } catch (error) {
          sendResponse({ success: false, error: getErrorMessage(error) })
        }
      })()
      return true
    }

    if (message.action === Action.MARK_AS_UNREAD) {
      ;(async () => {
        try {
          await markAsUnread(message.messageId)
          await pollUnreadMails()
          sendResponse({ success: true })
        } catch (error) {
          sendResponse({ success: false, error: getErrorMessage(error) })
        }
      })()
      return true
    }

    if (message.action === Action.FLAG_EMAIL) {
      ;(async () => {
        try {
          await flagEmail(message.messageId)
          sendResponse({ success: true })
        } catch (error) {
          sendResponse({ success: false, error: getErrorMessage(error) })
        }
      })()
      return true
    }

    if (message.action === Action.UNFLAG_EMAIL) {
      ;(async () => {
        try {
          await unflagEmail(message.messageId)
          sendResponse({ success: true })
        } catch (error) {
          sendResponse({ success: false, error: getErrorMessage(error) })
        }
      })()
      return true
    }

    if (message.action === Action.GET_MESSAGE_DETAIL) {
      ;(async () => {
        try {
          const data = await getMessageDetail(message.messageId)
          sendResponse({ success: true, data })
        } catch (error) {
          sendResponse({ success: false, error: getErrorMessage(error) })
        }
      })()
      return true
    }

    if (message.action === Action.SEARCH_EMAILS) {
      ;(async () => {
        try {
          const data = await searchEmails(message.query, message.filter)
          sendResponse({ success: true, data })
        } catch (error) {
          sendResponse({ success: false, error: getErrorMessage(error) })
        }
      })()
      return true
    }

    return false
  }
)

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === SUMMARIZE_EMAIL_PORT) {
    port.onMessage.addListener(async (msg) => {
      if (msg.action === Action.SUMMARIZE_EMAIL_STREAM) {
        const { emailId, email, forceRefresh } = msg
        try {
          const cacheKey = getSummaryCacheKey(emailId)
          if (!forceRefresh) {
            const cached = await chrome.storage.local.get(cacheKey)
            const cachedVal = cached[cacheKey]
            if (typeof cachedVal === "string" && cachedVal.trim()) {
              port.postMessage({ type: "DONE", result: cachedVal })
              return
            }
          }

          let emailDetail: MailMessageDetail = email
          if (!emailDetail) {
            emailDetail = await getMessageDetail(emailId)
          }

          const result = await summarizeEmailStream(
            emailDetail,
            (chunkText) => {
              port.postMessage({ type: "CHUNK", text: chunkText })
            }
          )

          await chrome.storage.local.set({ [cacheKey]: result })
          port.postMessage({ type: "DONE", result })
        } catch (error) {
          port.postMessage({ type: "ERROR", error: getErrorMessage(error) })
        }
      }
    })
  }
})
