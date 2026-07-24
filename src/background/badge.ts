import type { MailMessage } from "../types"
import { APP_NAME } from "../utils/constants"
import { getErrorMessage } from "../utils/error"

const BADGE_BACKGROUND_COLOR = "#D32F2F"
const MAX_TOOLTIP_EMAILS = 10

export function setUnreadBadge(count: number): void {
  try {
    let text = ""
    if (count > 0) {
      text = count > 99 ? "99+" : count.toString()
    }

    chrome.action.setBadgeText({ text })
    chrome.action.setBadgeBackgroundColor({ color: BADGE_BACKGROUND_COLOR })
  } catch (err) {
    console.error("Thiết lập badge tin nhắn chưa đọc thất bại:", getErrorMessage(err))
  }
}

export function setErrorBadge(): void {
  try {
    chrome.action.setBadgeText({ text: "!" })
    chrome.action.setBadgeBackgroundColor({ color: BADGE_BACKGROUND_COLOR })
  } catch (err) {
    console.error("Thiết lập badge lỗi thất bại:", getErrorMessage(err))
  }
}

export function setUnreadTooltip(emails: MailMessage[]): void {
  try {
    if (!emails || emails.length === 0) {
      chrome.action.setTitle({ title: APP_NAME })
      return
    }

    const preview = emails.slice(0, MAX_TOOLTIP_EMAILS)
    const lines = preview.map((m) => {
      const sender = m.sender.split("<")[0].trim() || m.sender
      const subject = m.subject || "(Không có tiêu đề)"
      return `${sender}: ${subject}`
    })

    const remaining = emails.length - preview.length
    if (remaining > 0) {
      lines.push(`... và ${remaining} thư khác`)
    }

    chrome.action.setTitle({ title: lines.join("\n") })
  } catch (err) {
    console.error("Thiết lập tooltip thất bại:", getErrorMessage(err))
  }
}

export function clearBadge(): void {
  try {
    chrome.action.setBadgeText({ text: "" })
    chrome.action.setTitle({ title: APP_NAME })
  } catch (err) {
    console.error("Xóa badge thất bại:", getErrorMessage(err))
  }
}
