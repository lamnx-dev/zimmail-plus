import { name } from "../../package.json"
import type { MailMessage } from "../types"
import { getErrorMessage } from "../utils/error"
import { openZimbraEmail } from "../utils/navigation"
import { flagEmail, markAsRead } from "./api"
import { pollUnreadMails } from "./polling"

export function showMailNotification(msg: MailMessage): void {
  try {
    const notificationId = `${name}-${msg.id}`

    const senderClean = msg.sender.split("<")[0].trim()

    chrome.notifications.create(notificationId, {
      type: "basic",
      iconUrl: "/icon.png",
      title: `${senderClean} - ${msg.subject}`,
      message: msg.fragment,
      buttons: [{ title: "Đánh dấu đã đọc" }, { title: "Gắn cờ" }],
    })
  } catch (error) {
    console.error("Hiển thị notification thất bại:", getErrorMessage(error))
  }
}

export function setupNotificationListeners(): void {
  chrome.notifications.onClicked.addListener(async (notificationId) => {
    try {
      const msgId = notificationId.replace(`${name}-`, "")
      await openZimbraEmail(msgId)
      chrome.notifications.clear(notificationId)
    } catch (error) {
      console.error("Xử lý sự kiện click notification thất bại:", getErrorMessage(error))
    }
  })

  chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
    try {
      const msgId = notificationId.replace(`${name}-`, "")

      if (buttonIndex === 0) {
        await markAsRead(msgId)
      } else if (buttonIndex === 1) {
        await flagEmail(msgId)
      }

      chrome.notifications.clear(notificationId)
      await pollUnreadMails()
    } catch (error) {
      console.error("Xử lý sự kiện click button notification thất bại:", getErrorMessage(error))
    }
  })
}
