import type { MailMessage } from "../types"
import { openZimbraInbox } from "../utils/navigation"

export function showMailNotification(msg: MailMessage): void {
  try {
    const notificationId = `teca-mail-${msg.id}`

    const senderClean = msg.sender.split("<")[0].trim()

    chrome.notifications.create(notificationId, {
      type: "basic",
      iconUrl: "/assets/icon.png",
      title: `${senderClean} - ${msg.subject}`,
      message: msg.fragment,
    })
  } catch (err) {
    console.error("Hiển thị notification thất bại:", err)
  }
}

export function setupNotificationListeners(): void {
  chrome.notifications.onClicked.addListener((notificationId) => {
    openZimbraInbox()
    chrome.notifications.clear(notificationId)
  })
}
