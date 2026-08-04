import { Action, AppStatus, EmailFilter } from "../utils/constants"

// --- Generic Helper Types ---

export type Nullish<T> = T | null | undefined

// --- Enum Derived Types ---

export type StatusType = (typeof AppStatus)[keyof typeof AppStatus]
export type ActionType = (typeof Action)[keyof typeof Action]
export type EmailFilterType = (typeof EmailFilter)[keyof typeof EmailFilter]

// --- Domain Models ---

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

// --- Application & Storage State ---

export interface AppState {
  status: StatusType
  isSyncing: boolean
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
  username: string
  autoLoginEnabled: boolean
}

export interface Secrets {
  password: string
  aiApiKey: string
}

// --- Chrome Runtime Message Response Types ---

export type MessageSuccessResponse<T = void> = T extends void
  ? { success: true; data?: undefined }
  : { success: true; data: T }

export interface MessageErrorResponse {
  success: false
  error: string
}

export type MessageResponse<T = void> =
  MessageSuccessResponse<T> | MessageErrorResponse

export type MessageResult<T = void> = MessageResponse<T> | undefined
