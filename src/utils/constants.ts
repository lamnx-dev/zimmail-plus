export const BASE_URL = "https://mail.teca.vn"

export const ActionType = {
  REFRESH: "refresh",
  MARK_AS_READ: "markAsRead",
  MARK_AS_UNREAD: "markAsUnread",
  MARK_ALL_AS_READ: "markAllAsRead",
  GET_MESSAGE_DETAIL: "getMessageDetail",
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
