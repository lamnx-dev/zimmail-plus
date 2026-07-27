import { ActionType as ActionTypeConst, AppStatus, EmailFilter } from "../utils/constants"

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

export type StatusType = (typeof AppStatus)[keyof typeof AppStatus]

export interface AppState {
  status: StatusType
  lastSyncTime: string | null
  emailAddress: string | null
  unreadEmails: MailMessage[] | null
}

export interface Settings {
  serverUrl: string
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

// --- Chrome Runtime Message Response Types ---

export type MessageSuccessResponse<T = void> = T extends void ? { success: true; data?: undefined } : { success: true; data: T }

export interface MessageErrorResponse {
  success: false
  error: string
}

export type MessageResponse<T = void> = MessageSuccessResponse<T> | MessageErrorResponse

export type MessageResult<T = void> = MessageResponse<T> | undefined
