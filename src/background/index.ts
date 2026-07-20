import { getAppState, getSettings, resetAppState, saveAppState } from "../storage/settings"
import { ActionType, AlarmName, BASE_URL } from "../utils/constants"
import { getErrorMessage } from "../utils/error"
import { getMessageDetail, getUserEmailFromToken, markAsRead, markAsUnread } from "./api"
import { setErrorBadge, setUnreadBadge } from "./badge"
import { setupNotificationListeners } from "./notification"
import { syncMailbox } from "./polling"

setupNotificationListeners()

function setupAlarm(intervalInMinutes: number): void {
  chrome.alarms.clear(AlarmName.MAILBOX_SYNC, () => {
    chrome.alarms.create(AlarmName.MAILBOX_SYNC, { periodInMinutes: intervalInMinutes })
  })
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === AlarmName.MAILBOX_SYNC) {
    try {
      await syncMailbox()
    } catch (err) {
      console.error("Chạy sync từ alarm thất bại:", err)
    }
  }
})

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync" && changes.pollingInterval) {
    const newInterval = (changes.pollingInterval.newValue as number) || 5
    setupAlarm(newInterval)
  }
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === ActionType.REFRESH) {
    const handleRefresh = async () => {
      try {
        await syncMailbox()
        sendResponse({ success: true })
      } catch (error) {
        sendResponse({ success: false, error: getErrorMessage(error) })
      }
    }
    handleRefresh()
    return true
  }

  if (message.action === ActionType.MARK_AS_READ) {
    const handleMarkAsRead = async () => {
      try {
        await markAsRead(message.messageId)
        const state = await getAppState()
        const updatedEmails = (state.unreadEmails || []).filter((email) => email.id !== message.messageId)
        const newUnreadCount = Math.max(0, state.unreadCount - 1)

        await saveAppState({
          unreadCount: newUnreadCount,
          unreadEmails: updatedEmails,
        })

        setUnreadBadge(newUnreadCount)
        sendResponse({ success: true })
      } catch (error) {
        sendResponse({ success: false, error: getErrorMessage(error) })
      }
    }
    handleMarkAsRead()
    return true
  }

  if (message.action === ActionType.MARK_AS_UNREAD) {
    const handleMarkAsUnread = async () => {
      try {
        await markAsUnread(message.messageId)
        await syncMailbox()
        sendResponse({ success: true })
      } catch (error) {
        sendResponse({ success: false, error: getErrorMessage(error) })
      }
    }
    handleMarkAsUnread()
    return true
  }

  if (message.action === ActionType.MARK_ALL_AS_READ) {
    const handleMarkAllAsRead = async () => {
      try {
        const state = await getAppState()
        const unreadEmails = state.unreadEmails || []
        if (unreadEmails.length > 0) {
          const emailIdsStr = unreadEmails.map((email) => email.id).join(",")
          await markAsRead(emailIdsStr)
        }

        await saveAppState({
          unreadCount: 0,
          unreadEmails: [],
        })

        setUnreadBadge(0)
        sendResponse({ success: true })
      } catch (error) {
        sendResponse({ success: false, error: getErrorMessage(error) })
      }
    }
    handleMarkAllAsRead()
    return true
  }

  if (message.action === ActionType.GET_MESSAGE_DETAIL) {
    const handleGetMessageDetail = async () => {
      try {
        const detail = await getMessageDetail(message.messageId)
        sendResponse({ success: true, detail })
      } catch (error) {
        sendResponse({ success: false, error: getErrorMessage(error) })
      }
    }
    handleGetMessageDetail()
    return true
  }

  return
})

async function syncUserEmail(): Promise<void> {
  try {
    const email = await getUserEmailFromToken()
    await saveAppState({ emailAddress: email })
  } catch (err) {
    console.error("Lấy email từ Token thất bại:", getErrorMessage(err))
    await saveAppState({ emailAddress: null })
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const settings = await getSettings()
    setupAlarm(settings.pollingInterval)

    await syncMailbox()
    await syncUserEmail()
  } catch (error) {
    console.error("Chạy sync lần đầu thất bại:", error)
  }
})

chrome.runtime.onStartup.addListener(async () => {
  try {
    const settings = await getSettings()
    setupAlarm(settings.pollingInterval)

    await syncMailbox()
    await syncUserEmail()
  } catch (error) {
    console.error("Chạy sync khi khởi động thất bại:", error)
  }
})

// --- Theo dõi trạng thái hoạt động trên trang mail.teca.vn ---

let isUserOnMailTeca = false

async function handleUrlTransition(url: string | undefined, type: "tab" | "window"): Promise<void> {
  const settings = await getSettings()
  if (type === "tab" && !settings.syncOnTabChange) return
  if (type === "window" && !settings.syncOnWindowFocus) return

  const isOnMail = !!(url && url.startsWith(BASE_URL))
  if (isOnMail !== isUserOnMailTeca) {
    isUserOnMailTeca = isOnMail

    // Đồng bộ lại hòm thư khi chuyển đổi trạng thái ra/vào web mail.teca.vn
    try {
      await syncMailbox()
    } catch (error) {
      console.error(`Chạy sync từ sự kiện chuyển ${type} thất bại:`, error)
    }
  }
}

async function checkInitialActiveTab(): Promise<void> {
  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    })
    if (activeTab && activeTab.url && activeTab.url.startsWith(BASE_URL)) {
      isUserOnMailTeca = true
    }
  } catch (error) {
    console.error("Kiểm tra active tab lúc khởi động thất bại:", error)
  }
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId)
    await handleUrlTransition(tab.url, "tab")
  } catch {
    // Có thể xảy ra lỗi nếu tab bị đóng trước khi truy vấn thông tin
  }
})

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) {
    handleUrlTransition(changeInfo.url, "tab")
  }
})

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await handleUrlTransition(undefined, "window")
    return
  }
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, windowId })
    if (activeTab) {
      await handleUrlTransition(activeTab.url, "window")
    }
  } catch {
    // Bỏ qua lỗi
  }
})

// --- Theo dõi thay đổi cookie ZM_AUTH_TOKEN để cập nhật emailAddress ---
chrome.cookies.onChanged.addListener(async (changeInfo) => {
  const domain = new URL(BASE_URL).hostname
  if (changeInfo.cookie.name === "ZM_AUTH_TOKEN" && changeInfo.cookie.domain.includes(domain)) {
    if (changeInfo.removed) {
      await resetAppState()
      setErrorBadge()
    } else {
      await syncMailbox()
      await syncUserEmail()
    }
  }
})

checkInitialActiveTab()
