import { useEffect, useRef } from "react"
import type { MailMessage, Nullish } from "../../types"
import { formatTime } from "../../utils/date"
import { EmailItem } from "./EmailItem"

interface EmailListProps {
  lastSyncTime?: Nullish<string>
  unreadEmailsCount?: number
  displayedEmails: MailMessage[]
  markReadLoading: Record<string, boolean>
  flagLoading: Record<string, boolean>
  markAllReadLoading: boolean
  focusedIndex?: number
  openMailDetail: (message: MailMessage, index: number) => void
  handleToggleRead: (id: string, isUnread: boolean) => void
  handleToggleFlag: (id: string, isFlagged: boolean) => void
  handleMarkAllAsRead: () => void
}

export default function EmailList({
  lastSyncTime,
  unreadEmailsCount = 0,
  displayedEmails,
  markReadLoading,
  flagLoading,
  markAllReadLoading,
  focusedIndex = -1,
  openMailDetail,
  handleToggleRead,
  handleToggleFlag,
  handleMarkAllAsRead,
}: EmailListProps) {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (focusedIndex >= 0) {
      const el = itemRefs.current[focusedIndex]
      if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [focusedIndex])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 scrollbar-thin flex-col divide-y divide-slate-200 overflow-y-auto">
        {displayedEmails.map((msg, index) => (
          <EmailItem
            key={msg.id}
            ref={(el) => {
              itemRefs.current[index] = el
            }}
            msg={msg}
            index={index}
            isFocused={index === focusedIndex}
            isMarkReadLoading={!!markReadLoading[msg.id]}
            isFlagLoading={!!flagLoading[msg.id]}
            openMailDetail={openMailDetail}
            handleToggleRead={handleToggleRead}
            handleToggleFlag={handleToggleFlag}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500 shadow-sm">
        <span>
          Đồng bộ lần cuối:{" "}
          <strong className="font-semibold">{formatTime(lastSyncTime)}</strong>
        </span>
        <button
          onClick={handleMarkAllAsRead}
          disabled={markAllReadLoading || !unreadEmailsCount}
          className="cursor-pointer rounded-lg border-none bg-transparent px-2 font-semibold text-blue-600 transition-colors outline-none select-none hover:text-orange-500 hover:underline focus-visible:ring-3 focus-visible:ring-blue-600/20 disabled:pointer-events-none disabled:no-underline disabled:opacity-50"
          title="Đánh dấu tất cả là đã đọc"
        >
          {markAllReadLoading ? "Đang xử lý..." : "Đọc tất cả"}
        </button>
      </div>
    </div>
  )
}
