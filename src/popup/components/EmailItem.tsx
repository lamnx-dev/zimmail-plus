import {
  Loader2,
  Mail,
  MailOpen,
  Paperclip,
  SquareArrowOutUpRight,
} from "lucide-react"
import { cn } from "../../lib/utils"
import type { MailMessage } from "../../types"
import { ZimbraMessageFlag } from "../../utils/constants"
import { openZimbraEmail } from "../../utils/navigation"
import {
  formatEmailDate,
  formatEmailFullDate,
  getAvatarColor,
  getAvatarLetter,
  getCleanSenderName,
} from "../utils"
import FlagIcon from "./FlagIcon"

interface EmailItemProps {
  msg: MailMessage
  index: number
  ref?: React.Ref<HTMLDivElement>
  isFocused: boolean
  isMarkReadLoading: boolean
  isFlagLoading: boolean
  openMailDetail: (message: MailMessage, index: number) => void
  handleToggleRead: (id: string, isUnread: boolean) => void
  handleToggleFlag: (id: string, isFlagged: boolean) => void
}

export function EmailItem({
  msg,
  index,
  ref,
  isFocused,
  isMarkReadLoading,
  isFlagLoading,
  openMailDetail,
  handleToggleRead,
  handleToggleFlag,
}: EmailItemProps) {
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
      ref={ref}
      onClick={() => openMailDetail(msg, index)}
      title="Bấm để xem chi tiết thư"
      className={cn(
        "group relative flex cursor-pointer gap-3 px-4 py-3 hover:bg-slate-50",
        isFocused && "border-l-4 border-l-blue-500 bg-blue-50/70 pl-3"
      )}
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
          <span
            className={cn(
              "flex-1 truncate text-xs",
              isUnread ? "font-bold" : "font-medium text-slate-500"
            )}
          >
            {cleanSender}
          </span>

          <div className="flex shrink-0 items-center gap-4">
            <div className="flex shrink-0 items-center gap-2.5">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleRead(msg.id, isUnread)
                }}
                disabled={isMarkReadLoading}
                title={isUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"}
                className={cn(
                  "flex size-4 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all duration-200 outline-none hover:text-slate-900 focus-visible:ring-3 focus-visible:ring-blue-600/20 active:scale-90 disabled:pointer-events-none",
                  isFocused
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                )}
              >
                {isMarkReadLoading ? (
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
                className={cn(
                  "flex size-4 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all duration-200 outline-none hover:text-slate-900 focus-visible:ring-3 focus-visible:ring-blue-600/20 active:scale-90",
                  isFocused
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                )}
              >
                <SquareArrowOutUpRight className="size-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              {hasAttachment && (
                <Paperclip className="size-3.5 shrink-0 text-slate-400" />
              )}
              <span
                className="text-xs whitespace-nowrap text-slate-500"
                title={fullDate}
              >
                {formattedDate}
              </span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "truncate text-xs",
            isUnread
              ? "font-semibold text-slate-800"
              : "font-medium text-slate-500"
          )}
        >
          {msg.subject}
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="line-clamp-1 min-w-0 flex-1 text-xs leading-relaxed text-slate-500">
            {msg.fragment}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleToggleFlag(msg.id, isFlagged)
            }}
            disabled={isFlagLoading}
            title={isFlagged ? "Bỏ gắn cờ" : "Gắn cờ"}
            className="flex size-5 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all duration-200 outline-none hover:text-red-500 focus-visible:ring-3 focus-visible:ring-blue-600/20 active:scale-90 disabled:pointer-events-none"
          >
            {isFlagLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FlagIcon isFlagged={isFlagged} className="size-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
