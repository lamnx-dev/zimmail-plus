import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col divide-y divide-border overflow-y-auto"
        )}
      >
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

      <div className="flex shrink-0 items-center justify-between bg-background px-4 py-2 text-xs text-muted-foreground outline outline-border">
        <span>
          Đồng bộ lần cuối:{" "}
          <strong className="font-semibold text-foreground">
            {formatTime(lastSyncTime)}
          </strong>
        </span>
        <Button
          variant="link"
          size="sm"
          onClick={handleMarkAllAsRead}
          disabled={markAllReadLoading || !unreadEmailsCount}
        >
          {markAllReadLoading ? "Đang xử lý..." : "Đọc tất cả"}
        </Button>
      </div>
    </div>
  )
}
