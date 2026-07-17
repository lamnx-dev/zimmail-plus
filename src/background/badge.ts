const BADGE_BACKGROUND_COLOR = '#D32F2F'

export function setUnreadBadge(count: number): void {
  try {
    let text = ''
    if (count > 0) {
      text = count > 99 ? '99+' : count.toString()
    }

    chrome.action.setBadgeText({ text })
    chrome.action.setBadgeBackgroundColor({ color: BADGE_BACKGROUND_COLOR })
  } catch (err) {
    console.error('Lỗi khi set unread badge:', err)
  }
}

export function setErrorBadge(): void {
  try {
    chrome.action.setBadgeText({ text: '!' })
    chrome.action.setBadgeBackgroundColor({ color: BADGE_BACKGROUND_COLOR })
  } catch (err) {
    console.error('Lỗi khi set error badge:', err)
  }
}

export function clearBadge(): void {
  try {
    chrome.action.setBadgeText({ text: '' })
  } catch (err) {
    console.error('Lỗi khi xóa badge:', err)
  }
}
