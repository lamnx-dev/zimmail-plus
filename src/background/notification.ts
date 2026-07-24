import { name } from "../../package.json"
import type { MailMessage } from "../types"
import { getErrorMessage } from "../utils/error"
import { openZimbraInbox } from "../utils/navigation"

export function showMailNotification(msg: MailMessage): void {
  try {
    const notificationId = `${name}-${msg.id}`

    const senderClean = msg.sender.split("<")[0].trim()

    chrome.notifications.create(notificationId, {
      type: "basic",
      iconUrl: "/icon.png",
      title: `${senderClean} - ${msg.subject}`,
      message: msg.fragment,
    })
  } catch (err) {
    console.error("Hiển thị notification thất bại:", getErrorMessage(err))
  }
}

export function setupNotificationListeners(): void {
  chrome.notifications.onClicked.addListener(async (notificationId) => {
    try {
      await openZimbraInbox()
      chrome.notifications.clear(notificationId)
    } catch (err) {
      console.error("Xử lý sự kiện click notification thất bại:", getErrorMessage(err))
    }
  })
}
