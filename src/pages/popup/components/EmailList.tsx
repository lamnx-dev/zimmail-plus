import { Loader2, Mail, MailOpen } from "lucide-react"
import type { AppState, MailMessage } from "../../../types"
import { formatEmailDate, getAvatarColor, getAvatarLetter, getCleanSenderName } from "../utils"

interface EmailListProps {
  appState: AppState | null
  displayedEmails: MailMessage[]
  markReadLoading: Record<string, boolean>
  markAllReadLoading: boolean
  openMailDetail: (messageId: string) => void
  handleToggleRead: (e: React.MouseEvent, id: string, isUnread: boolean) => void
  handleMarkAllAsRead: () => void
}

export default function EmailList({
  appState,
  displayedEmails,
  markReadLoading,
  markAllReadLoading,
  openMailDetail,
  handleToggleRead,
  handleMarkAllAsRead,
}: EmailListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 scrollbar-thin flex-col divide-y divide-slate-100 overflow-y-auto bg-white">
        {displayedEmails.map((msg) => {
          const isUnread = appState?.unreadEmails?.some((m) => m.id === msg.id) ?? false
          const avatarLetter = getAvatarLetter(msg.sender)
          const avatarColor = getAvatarColor(msg.sender)
          const cleanSender = getCleanSenderName(msg.sender)
          const formattedDate = formatEmailDate(msg.date)

          return (
            <div
              key={msg.id}
              onClick={() => openMailDetail(msg.id)}
              title="Bấm để xem chi tiết thư"
              className="group relative flex cursor-pointer gap-3 bg-white p-3 px-4 transition-colors hover:bg-slate-50"
            >
              {/* Avatar */}
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white uppercase shadow-inner"
                style={{ backgroundColor: avatarColor }}
              >
                {avatarLetter}
              </div>

              {/* Email Body */}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`flex-1 truncate text-[12px] ${isUnread ? "font-bold text-slate-900" : "font-medium text-slate-500"}`}>{cleanSender}</span>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {/* Mark Read/Unread Action */}
                    <button
                      onClick={(e) => handleToggleRead(e, msg.id, isUnread)}
                      disabled={markReadLoading[msg.id]}
                      title={isUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"}
                      className="flex w-0 cursor-pointer items-center justify-center overflow-hidden text-slate-500 opacity-0 transition-all duration-200 group-hover:w-4 group-hover:opacity-100 hover:text-green-600 active:scale-90"
                    >
                      {markReadLoading[msg.id] ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isUnread ? (
                        <MailOpen className="h-3.5 w-3.5" />
                      ) : (
                        <Mail className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <span className="text-[11px] whitespace-nowrap text-slate-500">{formattedDate}</span>
                  </div>
                </div>

                <div className={`truncate text-[12px] ${isUnread ? "font-semibold text-slate-800" : "font-medium text-slate-500"}`}>{msg.subject}</div>

                <div className="line-clamp-2 text-[12px] leading-relaxed text-slate-500">{msg.fragment || "(Không có nội dung preview)"}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 py-2.5 text-[11px] text-slate-500 shadow-sm">
        <span>
          Đồng bộ cuối: <strong className="font-semibold text-slate-900">{appState?.lastSyncTime || "--:--:--"}</strong>
        </span>
        <button
          onClick={handleMarkAllAsRead}
          disabled={markAllReadLoading || (appState?.unreadCount ?? 0) === 0}
          className="cursor-pointer border-none bg-transparent font-semibold text-blue-600 transition-colors hover:text-orange-500 hover:underline disabled:no-underline disabled:opacity-50"
          title="Đánh dấu tất cả là đã đọc"
        >
          {markAllReadLoading ? "Đang xử lý..." : "Đọc tất cả"}
        </button>
      </div>
    </div>
  )
}
