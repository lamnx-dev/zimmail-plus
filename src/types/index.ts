export interface MailMessage {
  id: string;
  subject: string;
  sender: string;
  date: string; // ISO string or human-readable
  fragment?: string;
}

export interface AttachmentInfo {
  part: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface MailMessageDetail extends MailMessage {
  bodyHtml?: string;
  bodyText?: string;
  attachments: AttachmentInfo[];
  to?: string[];
  cc?: string[];
}

export interface AppState {
  unreadCount: number;
  lastSyncTime: string;
  lastMessageId: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  emailAddress: string | null;
  unreadEmails?: MailMessage[];
}

export interface Settings {
  pollingInterval: number; // in minutes (e.g. 1, 2, 5)
  enableNotifications: boolean;
}
