import { Button } from "@/components/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Download,
  Loader2,
  Mail,
  MailOpen,
  Paperclip,
  RotateCcw,
  SquareArrowOutUpRight,
} from "lucide-react"
import React, { useEffect, useState } from "react"
import { downloadAttachment } from "../../background/api"
import { cn } from "../../lib/utils"
import type { EmailFilterType, MailMessageDetail } from "../../types"
import {
  ActionType,
  EmailFilter,
  ZimbraMessageFlag,
} from "../../utils/constants"
import { getErrorMessage } from "../../utils/error"
import { formatFileSize } from "../../utils/format"
import { openZimbraEmail } from "../../utils/navigation"
import { sendActionMessage } from "../../utils/sendActionMessage"
import {
  formatEmailFullDate,
  getAvatarColor,
  getAvatarLetter,
  getCleanSenderName,
} from "../utils"
import DetailSkeleton from "./DetailSkeleton"
import EmptyState from "./EmptyState"
import ErrorBanner from "./ErrorBanner"
import FlagIcon from "./FlagIcon"
import ShadowContent from "./ShadowContent"

interface EmailDetailProps {
  emailId: string
  filterType?: EmailFilterType
  handleGoBack: () => void
  onFlagsChange?: (id: string, updatedFlags: string) => void
  onToggleDetailReadRef?: React.RefObject<(() => void) | null>
  onToggleDetailFlagRef?: React.RefObject<(() => void) | null>
}

export default function EmailDetail({
  emailId,
  filterType,
  handleGoBack,
  onFlagsChange,
  onToggleDetailReadRef,
  onToggleDetailFlagRef,
}: EmailDetailProps) {
  const [emailDetail, setEmailDetail] = useState<MailMessageDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailMarkReadLoading, setDetailMarkReadLoading] = useState(false)
  const [detailFlagLoading, setDetailFlagLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, number | null>
  >({})
  const [downloadErrors, setDownloadErrors] = useState<
    Record<string, string | null>
  >({})

  const isUnread = !!emailDetail?.flags?.includes(ZimbraMessageFlag.UNREAD)
  const isFlagged = !!emailDetail?.flags?.includes(ZimbraMessageFlag.FLAGGED)

  useEffect(() => {
    if (!emailId) {
      setEmailDetail(null)
      setDetailError(null)
      setDownloadProgress({})
      setDownloadErrors({})
      return
    }

    setDetailLoading(true)
    setDetailError(null)

    sendActionMessage<MailMessageDetail>({
      action: ActionType.GET_MESSAGE_DETAIL,
      payload: { messageId: emailId },
      onSuccess: (detail) => {
        setDetailLoading(false)
        const isUnreadMsg = !!detail.flags?.includes(ZimbraMessageFlag.UNREAD)
        setEmailDetail(detail)

        if (isUnreadMsg) {
          sendActionMessage({
            action: ActionType.MARK_AS_READ,
            payload: { messageId: detail.id },
            onSuccess: () => {
              const updatedFlags =
                detail.flags?.replace(ZimbraMessageFlag.UNREAD, "") || ""
              setEmailDetail((prev) => prev && { ...prev, flags: updatedFlags })
              onFlagsChange?.(detail.id, updatedFlags)
            },
          })
        }
      },
      onError: (err) => {
        setDetailLoading(false)
        setDetailError(err)
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailId])

  useEffect(() => {
    if (onToggleDetailReadRef)
      onToggleDetailReadRef.current = handleToggleDetailRead
    if (onToggleDetailFlagRef)
      onToggleDetailFlagRef.current = handleToggleDetailFlag
  })

  function handleToggleDetailRead() {
    if (!emailDetail || detailMarkReadLoading) return
    setDetailMarkReadLoading(true)

    const targetAction = isUnread
      ? ActionType.MARK_AS_READ
      : ActionType.MARK_AS_UNREAD

    sendActionMessage({
      action: targetAction,
      payload: { messageId: emailDetail.id },
      onSuccess: () => {
        const updatedFlags = isUnread
          ? emailDetail.flags?.replace(ZimbraMessageFlag.UNREAD, "") || ""
          : (emailDetail.flags || "") + ZimbraMessageFlag.UNREAD
        setEmailDetail((prev) => prev && { ...prev, flags: updatedFlags })

        onFlagsChange?.(emailDetail.id, updatedFlags)

        if (!isUnread && filterType === EmailFilter.UNREAD) {
          handleGoBack()
        }
      },
      onError: (err) => {
        setDetailError(
          `${isUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"} thất bại: ${err}`
        )
      },
      onSettled: () => {
        setDetailMarkReadLoading(false)
      },
    })
  }

  function handleToggleDetailFlag() {
    if (!emailDetail || detailFlagLoading) return
    setDetailFlagLoading(true)

    const targetAction = isFlagged
      ? ActionType.UNFLAG_EMAIL
      : ActionType.FLAG_EMAIL

    sendActionMessage({
      action: targetAction,
      payload: { messageId: emailDetail.id },
      onSuccess: () => {
        const updatedFlags = isFlagged
          ? emailDetail.flags?.replace(ZimbraMessageFlag.FLAGGED, "") || ""
          : (emailDetail.flags || "") + ZimbraMessageFlag.FLAGGED
        setEmailDetail((prev) => prev && { ...prev, flags: updatedFlags })

        onFlagsChange?.(emailDetail.id, updatedFlags)

        if (!isFlagged && filterType === EmailFilter.FLAGGED) {
          handleGoBack()
        }
      },
      onError: (err) => {
        setDetailError(`${isFlagged ? "Bỏ gắn cờ" : "Gắn cờ"} thất bại: ${err}`)
      },
      onSettled: () => {
        setDetailFlagLoading(false)
      },
    })
  }

  async function handleDownloadAttachment(
    messageId: string,
    part: string,
    filename: string
  ) {
    if (downloadProgress[part] !== undefined && downloadProgress[part] !== null)
      return

    setDownloadErrors((prev) => ({ ...prev, [part]: null }))
    setDownloadProgress((prev) => ({ ...prev, [part]: 0 }))

    try {
      await downloadAttachment(messageId, part, filename, (percent) => {
        setDownloadProgress((prev) => ({ ...prev, [part]: percent }))
      })
      setDownloadProgress((prev) => ({ ...prev, [part]: 100 }))
      setTimeout(() => {
        setDownloadProgress((prev) => ({ ...prev, [part]: null }))
      }, 1500)
    } catch (error) {
      setDownloadErrors((prev) => ({ ...prev, [part]: getErrorMessage(error) }))
      setDownloadProgress((prev) => ({ ...prev, [part]: null }))
    }
  }

  if (detailLoading && !emailDetail) {
    return (
      <div
        key={emailId}
        className="flex h-full w-full flex-col opacity-90 transition-opacity duration-200"
      >
        <DetailSkeleton handleGoBack={handleGoBack} />
      </div>
    )
  }

  if (!emailDetail) {
    if (detailError) {
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleGoBack}
                  className="rounded-full"
                >
                  <ArrowLeft className="size-4" />
                  <span className="sr-only">Quay lại</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Quay lại</span>
                <Kbd>←</Kbd>
              </TooltipContent>
            </Tooltip>
          </div>

          <EmptyState
            icon={<AlertTriangle className="size-6" />}
            iconClassName="bg-destructive/10 text-destructive"
            title="Không thể tải nội dung thư"
            description={detailError}
            action={
              <Button onClick={handleGoBack} size="sm" className="mt-1">
                Quay lại danh sách
              </Button>
            }
          />
        </div>
      )
    }
    return null
  }

  const avatarColor = getAvatarColor(emailDetail.sender)
  const avatarLetter = getAvatarLetter(emailDetail.sender)
  const cleanSender = getCleanSenderName(emailDetail.sender)
  const fullDate = formatEmailFullDate(emailDetail.date)

  return (
    <div
      key={emailDetail.id}
      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background opacity-100 transition-opacity duration-200 ease-in-out"
    >
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGoBack}
                className="rounded-full"
              >
                <ArrowLeft className="size-4" />
                <span className="sr-only">Quay lại</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Quay lại</span>
              <Kbd>←</Kbd>
            </TooltipContent>
          </Tooltip>
          <span
            className="truncate text-sm font-semibold"
            title={emailDetail.subject}
          >
            {emailDetail.subject}
          </span>
        </div>

        <div className="ml-2 flex shrink-0 gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleDetailRead}
                disabled={detailMarkReadLoading}
                className="rounded-full"
              >
                {detailMarkReadLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isUnread ? (
                  <MailOpen className="size-4" />
                ) : (
                  <Mail className="size-4" />
                )}
                <span className="sr-only">
                  {isUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>{isUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"}</span>
              <Kbd>M</Kbd>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleDetailFlag}
                disabled={detailFlagLoading}
                className="rounded-full"
              >
                {detailFlagLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FlagIcon isFlagged={isFlagged} className="size-4" />
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openZimbraEmail(emailDetail.id)}
                className="rounded-full"
              >
                <SquareArrowOutUpRight className="size-4" />
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
      </div>

      {detailError && (
        <div className="p-2">
          <ErrorBanner
            errorMessage={detailError}
            setErrorMessage={setDetailError}
          />
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        <div className="flex items-center gap-3 border-b pb-3.5">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white uppercase shadow-xs"
            style={{ backgroundColor: avatarColor }}
          >
            {avatarLetter}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-xs font-semibold text-foreground">
                {cleanSender}
              </span>
              <span className="text-xs whitespace-nowrap text-muted-foreground">
                {fullDate}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <span
                className={
                  emailDetail.cc && emailDetail.cc.length > 0
                    ? "max-w-1/2 shrink-0 truncate"
                    : "truncate"
                }
                title={`Tới: ${
                  emailDetail.to && emailDetail.to.length > 0
                    ? emailDetail.to.join(", ")
                    : "--"
                }`}
              >
                Tới:{" "}
                {emailDetail.to && emailDetail.to.length > 0
                  ? emailDetail.to.join(", ")
                  : "--"}
              </span>
              {emailDetail.cc && emailDetail.cc.length > 0 && (
                <>
                  <span className="shrink-0">|</span>
                  <span
                    className="truncate"
                    title={`Cc: ${emailDetail.cc.join(", ")}`}
                  >
                    Cc: {emailDetail.cc.join(", ")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {emailDetail.attachments && emailDetail.attachments.length > 0 && (
          <ItemGroup>
            {emailDetail.attachments.map((att) => {
              const formattedSize = formatFileSize(att.size)
              const progress = downloadProgress[att.part] ?? null
              const error = downloadErrors[att.part] ?? null
              const isDownloading = progress !== null
              const handleDownload = () =>
                handleDownloadAttachment(
                  emailDetail.id + 1000000000000,
                  att.part,
                  att.filename
                )

              return (
                <Item
                  key={att.part}
                  variant="outline"
                  size="xs"
                  className={cn(
                    error && "border-destructive/40 bg-destructive/5"
                  )}
                >
                  <ItemMedia variant="icon">
                    <Paperclip
                      className={cn(
                        "size-3.5 shrink-0",
                        error && "text-destructive"
                      )}
                    />
                  </ItemMedia>

                  <ItemContent className="gap-0!">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="link"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className={cn(
                          "h-auto cursor-pointer p-0",
                          error
                            ? "text-destructive hover:text-destructive/80"
                            : "text-foreground hover:text-primary"
                        )}
                        title={`Tải xuống: ${att.filename}`}
                        asChild
                      >
                        <ItemTitle>{att.filename}</ItemTitle>
                      </Button>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        ({formattedSize})
                      </span>
                    </div>

                    {error && (
                      <ItemDescription className="text-destructive">
                        Tải thất bại: {error}
                      </ItemDescription>
                    )}
                  </ItemContent>

                  <ItemActions>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="group h-auto rounded-full hover:bg-transparent"
                      title={
                        progress === 100
                          ? "Đã tải xong"
                          : isDownloading
                            ? `Đang tải: ${progress}%`
                            : error
                              ? "Thử lại tải file"
                              : "Tải xuống"
                      }
                    >
                      {progress === 100 ? (
                        <Check className="text-emerald-600" />
                      ) : isDownloading ? (
                        <span className="text-primary">{progress}%</span>
                      ) : error ? (
                        <RotateCcw className="text-destructive" />
                      ) : (
                        <Download className="group-hover:text-primary" />
                      )}
                    </Button>
                  </ItemActions>

                  {isDownloading && (
                    <div className="absolute bottom-0 left-0 h-0.5 w-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all duration-150 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </Item>
              )
            })}
          </ItemGroup>
        )}

        <ShadowContent
          html={emailDetail.bodyHtml}
          text={emailDetail.bodyText}
        />
      </div>
    </div>
  )
}
