export const BASE_URL = "https://mail.teca.vn"

export const ActionType = {
  REFRESH: "refresh",
  MARK_AS_READ: "markAsRead",
  MARK_AS_UNREAD: "markAsUnread",
  MARK_ALL_AS_READ: "markAllAsRead",
  GET_MESSAGE_DETAIL: "getMessageDetail",
  SEARCH_EMAILS: "searchEmails",
} as const

export const ZimbraErrorCode = {
  AUTH_EXPIRED: "service.AUTH_EXPIRED",
} as const

export const ConnectionStatus = {
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
} as const

export const AlarmName = {
  MAILBOX_SYNC: "mailbox-sync",
} as const

export const EmailFilter = {
  ALL: "all",
  UNREAD: "unread",
  READ: "read",
} as const

/**
 * Loại người tham gia email.
 */
export const ZimbraParticipantType = {
  /** `c`: CC (Carbon Copy) */
  CC: "c",
  /** `f`: From (Người gửi) */
  FROM: "f",
  /** `t`: To (Người nhận) */
  TO: "t",
} as const

/**
 * Các cờ trạng thái email (Zimbra Message Flags).
 */
export const ZimbraMessageFlag = {
  /** `u`: Unread (Chưa đọc) */
  UNREAD: "u",
  /** `f`: Flagged (Đã gắn cờ/đánh dấu) */
  FLAGGED: "f",
  /** `a`: Has attachment (Có tệp đính kèm) */
  HAS_ATTACHMENT: "a",
  /** `r`: Replied (Đã trả lời) */
  REPLIED: "r",
  /** `s`: Sent by me (Email do chính tôi gửi) */
  SENT_BY_ME: "s",
  /** `w`: Forwarded (Đã chuyển tiếp) */
  FORWARDED: "w",
  /** `v`: Calendar invite (Lời mời lịch/cuộc họp) */
  CALENDAR_INVITE: "v",
  /** `d`: Draft (Bản nháp) */
  DRAFT: "d",
  /** `x`: Deleted (Đã xóa) */
  DELETED: "x",
  /** `n`: Notification sent (Đã gửi thông báo) */
  NOTIFICATION_SENT: "n",
  /** `!`: High priority (Khẩn cấp) */
  URGENT: "!",
  /** `?`: Low priority (Ưu tiên thấp) */
  LOW_PRIORITY: "?",
  /** `+`: Priority (Ưu tiên) */
  PRIORITY: "+",
} as const
