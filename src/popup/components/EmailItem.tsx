import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Mail, MailOpen, Paperclip, SquareArrowOutUpRight } from "lucide-react"
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
      className={cn(
        "group relative flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
        isFocused && "border-l-4 border-l-primary bg-accent/60 pl-3"
      )}
    >
      {/* Avatar */}
      <div
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white uppercase shadow-xs"
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
              isUnread ? "font-bold" : "font-medium text-muted-foreground"
            )}
          >
            {cleanSender}
          </span>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex shrink-0 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleRead(msg.id, isUnread)
                    }}
                    disabled={isMarkReadLoading}
                    className={cn(
                      "h-auto text-muted-foreground transition-opacity",
                      !isFocused && "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {isMarkReadLoading ? (
                      <Spinner />
                    ) : isUnread ? (
                      <MailOpen />
                    ) : (
                      <Mail />
                    )}
                    <span className="sr-only">
                      {isUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>
                    {isUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"}
                  </span>
                  <Kbd>M</Kbd>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      openZimbraEmail(msg.id)
                    }}
                    className={cn(
                      "h-auto text-muted-foreground transition-opacity",
                      !isFocused && "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <SquareArrowOutUpRight />
                    <span className="sr-only">Mở Web Mail</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Mở Web Mail</span>
                  <KbdGroup>
                    <Kbd>Shift</Kbd>
                    <Kbd>O</Kbd>
                  </KbdGroup>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-1">
              {hasAttachment && (
                <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              <Tooltip>
                <TooltipTrigger className="text-xs whitespace-nowrap text-muted-foreground">
                  {formattedDate}
                </TooltipTrigger>
                <TooltipContent>{fullDate}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "truncate text-xs",
            isUnread
              ? "font-semibold text-foreground"
              : "font-medium text-muted-foreground"
          )}
        >
          {msg.subject}
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="line-clamp-1 min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground">
            {msg.fragment}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleFlag(msg.id, isFlagged)
                }}
                disabled={isFlagLoading}
                className="h-auto text-muted-foreground hover:text-destructive"
              >
                {isFlagLoading ? (
                  <Spinner />
                ) : (
                  <FlagIcon isFlagged={isFlagged} />
                )}
                <span className="sr-only">
                  {isFlagged ? "Bỏ gắn cờ" : "Gắn cờ"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>{isFlagged ? "Bỏ gắn cờ" : "Gắn cờ"}</span>
              <Kbd>F</Kbd>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
