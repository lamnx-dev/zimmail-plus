import { ActionType as ActionTypeConst, ConnectionStatus, EmailFilter } from "../utils/constants"

export interface MailMessage {
  id: string
  subject: string
  sender: string
  date: string
  fragment: string
  flags: string
}

export interface AttachmentInfo {
  part: string
  filename: string
  contentType: string
  size: number
}

export interface MailMessageDetail extends MailMessage {
  bodyHtml?: string
  bodyText?: string
  attachments: AttachmentInfo[]
  to?: string[]
  cc?: string[]
}

export type ConnectionStatusType = (typeof ConnectionStatus)[keyof typeof ConnectionStatus]

export interface AppState {
  unreadCount: number
  lastSyncTime: string
  connectionStatus: ConnectionStatusType
  emailAddress: string | null
  unreadEmails?: MailMessage[]
}

export interface Settings {
  pollingInterval: number
  enableNotifications: boolean
  syncOnTabChange: boolean
  syncOnWindowFocus: boolean
}

export interface Credentials {
  username?: string
  password?: string
  autoLoginEnabled: boolean
}

export type ActionType = (typeof ActionTypeConst)[keyof typeof ActionTypeConst]

export type EmailFilterType = (typeof EmailFilter)[keyof typeof EmailFilter]
