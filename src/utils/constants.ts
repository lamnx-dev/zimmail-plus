export const APP_NAME = "ZimMail Plus"

export const ActionType = {
  REFRESH: "REFRESH",
  MARK_AS_READ: "MARK_AS_READ",
  MARK_AS_UNREAD: "MARK_AS_UNREAD",
  MARK_ALL_AS_READ: "MARK_ALL_AS_READ",
  FLAG_EMAIL: "FLAG_EMAIL",
  UNFLAG_EMAIL: "UNFLAG_EMAIL",
  GET_MESSAGE_DETAIL: "GET_MESSAGE_DETAIL",
  SEARCH_EMAILS: "SEARCH_EMAILS",
} as const

export const ZimbraErrorCode = {
  SERVICE_AUTH_REQUIRED: "service.AUTH_REQUIRED",
  SERVICE_AUTH_EXPIRED: "service.AUTH_EXPIRED",
} as const

export const ConnectionStatus = {
  CONNECTED: "CONNECTED",
  DISCONNECTED: "DISCONNECTED",
  CONNECTING: "CONNECTING",
} as const

export const AlarmName = {
  MAILBOX_SYNC: "MAILBOX_SYNC",
} as const

export const EmailFilter = {
  ALL: "ALL",
  UNREAD: "UNREAD",
  FLAGGED: "FLAGGED",
  HAS_ATTACHMENT: "HAS_ATTACHMENT",
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
