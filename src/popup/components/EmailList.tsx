import { Loader2, Mail, MailOpen, Paperclip, SquareArrowOutUpRight } from "lucide-react"
import type { AppState, MailMessage } from "../../types"
import { cn } from "../../utils/cn"
import { ZimbraMessageFlag } from "../../utils/constants"
import { openZimbraEmail } from "../../utils/navigation"
import { formatEmailDate, formatEmailFullDate, getAvatarColor, getAvatarLetter, getCleanSenderName } from "../utils"
import FlagIcon from "./FlagIcon"

interface EmailListProps {
  appState: AppState | null
  displayedEmails: MailMessage[]
  markReadLoading: Record<string, boolean>
  flagLoading: Record<string, boolean>
  markAllReadLoading: boolean
  openMailDetail: (messageId: string) => void
  handleToggleRead: (e: React.MouseEvent, id: string, isUnread: boolean) => void
  handleToggleFlag: (e: React.MouseEvent, id: string, isFlagged: boolean) => void
  handleMarkAllAsRead: () => void
}

export default function EmailList({
  appState,
  displayedEmails,
  markReadLoading,
  flagLoading,
  markAllReadLoading,
  openMailDetail,
  handleToggleRead,
  handleToggleFlag,
  handleMarkAllAsRead,
}: EmailListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 scrollbar-thin flex-col divide-y divide-slate-200 overflow-y-auto">
        {displayedEmails.map((msg) => {
          const isUnread = !!msg.flags?.includes(ZimbraMessageFlag.UNREAD)
          const isFlagged = !!msg.flags?.includes(ZimbraMessageFlag.FLAGGED)
          const hasAttachment = !!msg.flags?.includes(ZimbraMessageFlag.HAS_ATTACHMENT)
          const avatarLetter = getAvatarLetter(msg.sender)
          const avatarColor = getAvatarColor(msg.sender)
          const cleanSender = getCleanSenderName(msg.sender)
          const formattedDate = formatEmailDate(msg.date)
          const fullDate = formatEmailFullDate(msg.date)

          return (
            <div
              key={msg.id}
              onClick={() => openMailDetail(msg.id)}
              title="Bấm để xem chi tiết thư"
              className="group relative flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
            >
              {/* Avatar */}
              <div
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white uppercase shadow-inner"
                style={{ backgroundColor: avatarColor }}
              >
                {avatarLetter}
              </div>

              {/* Email Body */}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={cn("flex-1 truncate text-xs", isUnread ? "font-bold" : "font-medium text-slate-500")}>{cleanSender}</span>

                  <div className="flex shrink-0 items-center gap-4">
                    <div className="flex shrink-0 items-center gap-2.5">
                      <button
                        onClick={(e) => handleToggleRead(e, msg.id, isUnread)}
                        disabled={markReadLoading[msg.id]}
                        title={isUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"}
                        className="flex size-4 cursor-pointer items-center justify-center text-slate-500 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:text-slate-900 active:scale-90 disabled:pointer-events-none"
                      >
                        {markReadLoading[msg.id] ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : isUnread ? (
                          <MailOpen className="size-3.5" />
                        ) : (
                          <Mail className="size-3.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openZimbraEmail(msg.id)
                        }}
                        title="Mở Web Mail"
                        className="flex size-4 cursor-pointer items-center justify-center text-slate-500 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:text-slate-900 active:scale-90"
                      >
                        <SquareArrowOutUpRight className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      {hasAttachment && <Paperclip className="size-3.5 shrink-0 text-slate-400" />}
                      <span className="text-xs whitespace-nowrap text-slate-500" title={fullDate}>
                        {formattedDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={cn("truncate text-xs", isUnread ? "font-semibold text-slate-800" : "font-medium text-slate-500")}>{msg.subject}</div>

                <div className="flex items-end justify-between gap-2">
                  <div className="line-clamp-1 min-w-0 flex-1 text-xs leading-relaxed text-slate-500">{msg.fragment}</div>
                  <button
                    onClick={(e) => handleToggleFlag(e, msg.id, isFlagged)}
                    disabled={flagLoading[msg.id]}
                    title={isFlagged ? "Bỏ gắn cờ" : "Gắn cờ"}
                    className="flex size-5 cursor-pointer items-center justify-center text-slate-500 transition-all duration-200 hover:text-red-500 active:scale-90 disabled:pointer-events-none"
                  >
                    {flagLoading[msg.id] ? <Loader2 className="size-4 animate-spin" /> : <FlagIcon isFlagged={isFlagged} className="size-4" />}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500 shadow-sm">
        <span>
          Đồng bộ lần cuối: <strong className="font-semibold">{appState?.lastSyncTime || "--:--:--"}</strong>
        </span>
        <button
          onClick={handleMarkAllAsRead}
          disabled={markAllReadLoading || (appState?.unreadCount ?? 0) === 0}
          className="cursor-pointer border-none bg-transparent font-semibold text-blue-600 transition-colors select-none hover:text-orange-500 hover:underline disabled:pointer-events-none disabled:no-underline disabled:opacity-50"
          title="Đánh dấu tất cả là đã đọc"
        >
          {markAllReadLoading ? "Đang xử lý..." : "Đọc tất cả"}
        </button>
      </div>
    </div>
  )
}
