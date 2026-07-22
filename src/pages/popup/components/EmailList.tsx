import { Loader2, Mail, MailOpen, SquareArrowOutUpRight } from "lucide-react"
import type { AppState, MailMessage } from "../../../types"
import { BASE_URL } from "../../../utils/constants"
import { openZimbraEmail } from "../../../utils/navigation"
import { formatEmailDate, formatEmailFullDate, getAvatarColor, getAvatarLetter, getCleanSenderName } from "../utils"

interface EmailListProps {
  appState: AppState | null
  displayedEmails: MailMessage[]
  markReadLoading: Record<string, boolean>
  markAllReadLoading: boolean
  isReadTab?: boolean
  openMailDetail: (messageId: string) => void
  handleToggleRead: (e: React.MouseEvent, id: string, isUnread: boolean) => void
  handleMarkAllAsRead: () => void
}

export default function EmailList({
  appState,
  displayedEmails,
  markReadLoading,
  markAllReadLoading,
  isReadTab,
  openMailDetail,
  handleToggleRead,
  handleMarkAllAsRead,
}: EmailListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 scrollbar-thin flex-col divide-y divide-slate-100 overflow-y-auto bg-white">
        {displayedEmails.map((msg) => {
          const isUnread = !!msg.flags?.includes("u")
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
                  <span className={`flex-1 truncate text-xs ${isUnread ? "font-bold text-slate-900" : "font-medium text-slate-500"}`}>{cleanSender}</span>

                  <div className="flex shrink-0 items-center gap-2">
                    {/* Mark Read/Unread Action */}
                    <button
                      onClick={(e) => handleToggleRead(e, msg.id, isUnread)}
                      disabled={markReadLoading[msg.id]}
                      title={isUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"}
                      className={`flex w-4 cursor-pointer items-center justify-center overflow-hidden text-slate-500 transition-all duration-200 hover:text-green-600 ${markReadLoading[msg.id] ? "" : "opacity-0 group-hover:opacity-100"}`}
                    >
                      {markReadLoading[msg.id] ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isUnread ? (
                        <MailOpen className="h-3.5 w-3.5" />
                      ) : (
                        <Mail className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openZimbraEmail(msg.id)
                      }}
                      title={`Mở ${BASE_URL}`}
                      className="flex w-4 cursor-pointer items-center justify-center overflow-hidden text-slate-500 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:text-blue-600"
                    >
                      <SquareArrowOutUpRight className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs whitespace-nowrap text-slate-500" title={fullDate}>
                      {formattedDate}
                    </span>
                  </div>
                </div>

                <div className={`truncate text-xs ${isUnread ? "font-semibold text-slate-800" : "font-medium text-slate-500"}`}>{msg.subject}</div>

                <div className="line-clamp-2 text-xs leading-relaxed text-slate-500">{msg.fragment}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-500 shadow-sm">
        <span>
          Đồng bộ lần cuối: <strong className="font-semibold text-slate-900">{appState?.lastSyncTime || "--:--:--"}</strong>
        </span>
        <button
          onClick={handleMarkAllAsRead}
          disabled={markAllReadLoading || (appState?.unreadCount ?? 0) === 0 || isReadTab}
          className="cursor-pointer border-none bg-transparent font-semibold text-blue-600 transition-colors select-none hover:text-orange-500 hover:underline disabled:pointer-events-none disabled:no-underline disabled:opacity-50"
          title="Đánh dấu tất cả là đã đọc"
        >
          {markAllReadLoading ? "Đang xử lý..." : "Đọc tất cả"}
        </button>
      </div>
    </div>
  )
}
