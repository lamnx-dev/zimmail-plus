import { getAppState, getSettings, saveAppState } from "../storage/settings"
import { BASE_URL } from "../utils/constants"
import { getMessageDetail, markAsRead, markAsUnread } from "./api"
import { setUnreadBadge } from "./badge"
import { setupNotificationListeners } from "./notification"
import { syncMailbox } from "./polling"

setupNotificationListeners()

function setupAlarm(intervalInMinutes: number): void {
  chrome.alarms.clear("sync-alarm", () => {
    chrome.alarms.create("sync-alarm", { periodInMinutes: intervalInMinutes })
  })
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "sync-alarm") {
    try {
      await syncMailbox()
    } catch (err) {
      console.error("Lỗi khi chạy sync từ alarm:", err)
    }
  }
})

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync" && changes.pollingInterval) {
    const newInterval = (changes.pollingInterval.newValue as number) || 1
    setupAlarm(newInterval)
  }
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "refresh") {
    const handleRefresh = async () => {
      try {
        await syncMailbox(true)
        sendResponse({ success: true })
      } catch (err) {
        console.error("Lỗi khi đồng bộ thủ công:", err)
        sendResponse({ success: false, error: (err as Error).message })
      }
    }
    handleRefresh()
    return true
  }

  if (message.action === "markAsRead") {
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
      } catch (err) {
        console.error("Lỗi khi đánh dấu đã đọc:", err)
        sendResponse({ success: false, error: (err as Error).message })
      }
    }
    handleMarkAsRead()
    return true
  }

  if (message.action === "markAsUnread") {
    const handleMarkAsUnread = async () => {
      try {
        await markAsUnread(message.messageId)
        await syncMailbox(true)
        sendResponse({ success: true })
      } catch (err) {
        console.error("Lỗi khi đánh dấu chưa đọc:", err)
        sendResponse({ success: false, error: (err as Error).message })
      }
    }
    handleMarkAsUnread()
    return true
  }

  if (message.action === "markAllAsRead") {
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
      } catch (err) {
        console.error("Lỗi khi đánh dấu đã đọc tất cả:", err)
        sendResponse({ success: false, error: (err as Error).message })
      }
    }
    handleMarkAllAsRead()
    return true
  }

  if (message.action === "getMessageDetail") {
    const handleGetMessageDetail = async () => {
      try {
        const detail = await getMessageDetail(message.messageId)
        sendResponse({ success: true, detail })
      } catch (err) {
        console.error("Lỗi khi lấy chi tiết thư:", err)
        sendResponse({ success: false, error: (err as Error).message })
      }
    }
    handleGetMessageDetail()
    return true
  }

  return
})

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const settings = await getSettings()
    setupAlarm(settings.pollingInterval)

    await syncMailbox()
  } catch (err) {
    console.error("Lỗi chạy sync lần đầu:", err)
  }
})

chrome.runtime.onStartup.addListener(async () => {
  try {
    const settings = await getSettings()
    setupAlarm(settings.pollingInterval)

    await syncMailbox()
  } catch (err) {
    console.error("Lỗi chạy sync khi khởi động:", err)
  }
})

// --- Theo dõi trạng thái hoạt động trên trang mail.teca.vn ---

let isUserOnMailTeca = false

async function handleUrlTransition(url: string | undefined): Promise<void> {
  const isOnMail = !!(url && url.startsWith(BASE_URL))
  if (isOnMail !== isUserOnMailTeca) {
    isUserOnMailTeca = isOnMail

    // Đồng bộ lại hòm thư khi chuyển đổi trạng thái ra/vào web mail.teca.vn
    try {
      await syncMailbox()
    } catch (err) {
      console.error("Lỗi khi chạy sync từ sự kiện chuyển tab/cửa sổ:", err)
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
  } catch (err) {
    console.error("Lỗi khi kiểm tra active tab lúc khởi động:", err)
  }
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId)
    await handleUrlTransition(tab.url)
  } catch {
    // Có thể xảy ra lỗi nếu tab bị đóng trước khi truy vấn thông tin
  }
})

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) {
    handleUrlTransition(changeInfo.url)
  }
})

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Trình duyệt mất focus hoàn toàn
    await handleUrlTransition(undefined)
    return
  }
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, windowId })
    if (activeTab) {
      await handleUrlTransition(activeTab.url)
    }
  } catch {
    // Bỏ qua lỗi
  }
})

checkInitialActiveTab()
