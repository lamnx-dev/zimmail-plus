import { AlertCircle, AlertTriangle, ArrowLeft, Check, Download, Loader2, Mail, MailOpen, Paperclip, SquareArrowOutUpRight } from "lucide-react"
import { useEffect, useState } from "react"
import { downloadAttachment } from "../../background/api"
import type { EmailFilterType, MailMessageDetail } from "../../types"
import { cn } from "../../utils/cn"
import { ActionType, EmailFilter, ZimbraMessageFlag } from "../../utils/constants"
import { getErrorMessage } from "../../utils/error"
import { formatFileSize } from "../../utils/format"
import { openZimbraEmail } from "../../utils/navigation"
import { sendActionMessage } from "../../utils/sendActionMessage"
import { formatEmailFullDate, getAvatarColor, getAvatarLetter, getCleanSenderName } from "../utils"
import DetailSkeleton from "./DetailSkeleton"
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

export default function EmailDetail({ emailId, filterType, handleGoBack, onFlagsChange, onToggleDetailReadRef, onToggleDetailFlagRef }: EmailDetailProps) {
  const [emailDetail, setEmailDetail] = useState<MailMessageDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailMarkReadLoading, setDetailMarkReadLoading] = useState(false)
  const [detailFlagLoading, setDetailFlagLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const [downloadProgress, setDownloadProgress] = useState<Record<string, number | null>>({})
  const [downloadErrors, setDownloadErrors] = useState<Record<string, string | null>>({})

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
        const isUnread = !!detail.flags?.includes(ZimbraMessageFlag.UNREAD)
        setEmailDetail(detail)

        if (isUnread) {
          sendActionMessage({
            action: ActionType.MARK_AS_READ,
            payload: { messageId: detail.id },
            onSuccess: () => {
              const updatedFlags = detail.flags?.replace(ZimbraMessageFlag.UNREAD, "") || ""
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

  const isUnread = !!emailDetail?.flags?.includes(ZimbraMessageFlag.UNREAD)
  const isFlagged = !!emailDetail?.flags?.includes(ZimbraMessageFlag.FLAGGED)

  const handleToggleDetailRead = () => {
    if (!emailDetail || detailMarkReadLoading) return
    setDetailMarkReadLoading(true)

    const targetAction = isUnread ? ActionType.MARK_AS_READ : ActionType.MARK_AS_UNREAD

    sendActionMessage({
      action: targetAction,
      payload: { messageId: emailDetail.id },
      onSuccess: () => {
        const updatedFlags = isUnread ? emailDetail.flags?.replace(ZimbraMessageFlag.UNREAD, "") || "" : (emailDetail.flags || "") + ZimbraMessageFlag.UNREAD
        setEmailDetail((prev) => prev && { ...prev, flags: updatedFlags })

        onFlagsChange?.(emailDetail.id, updatedFlags)

        if (!isUnread && filterType === EmailFilter.UNREAD) {
          handleGoBack()
        }
      },
      onError: (err) => {
        setDetailError(`${isUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"} thất bại: ${err}`)
      },
      onSettled: () => {
        setDetailMarkReadLoading(false)
      },
    })
  }

  const handleToggleDetailFlag = () => {
    if (!emailDetail || detailFlagLoading) return
    setDetailFlagLoading(true)

    const targetAction = isFlagged ? ActionType.UNFLAG_EMAIL : ActionType.FLAG_EMAIL

    sendActionMessage({
      action: targetAction,
      payload: { messageId: emailDetail.id },
      onSuccess: () => {
        const updatedFlags = isFlagged ? emailDetail.flags?.replace(ZimbraMessageFlag.FLAGGED, "") || "" : (emailDetail.flags || "") + ZimbraMessageFlag.FLAGGED
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

  useEffect(() => {
    if (onToggleDetailReadRef) onToggleDetailReadRef.current = handleToggleDetailRead
    if (onToggleDetailFlagRef) onToggleDetailFlagRef.current = handleToggleDetailFlag
  })

  const handleDownloadAttachment = async (messageId: string, part: string, filename: string) => {
    if (downloadProgress[part] !== undefined && downloadProgress[part] !== null) return

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
      <div key={emailId} className="flex h-full w-full flex-col opacity-90 transition-opacity duration-200">
        <DetailSkeleton handleGoBack={handleGoBack} />
      </div>
    )
  }

  if (!emailDetail) {
    if (detailError) {
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-3 py-2">
            <button
              onClick={handleGoBack}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
              title="Quay lại"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-slate-900">Không thể tải nội dung thư</h3>
            <p className="mb-4 max-w-xs text-xs text-slate-500">{detailError}</p>
            <button
              onClick={handleGoBack}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-slate-800 active:scale-95"
            >
              Quay lại danh sách
            </button>
          </div>
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
    <div key={emailDetail.id} className="flex min-h-0 flex-1 flex-col overflow-hidden opacity-100 transition-opacity duration-200 ease-in-out">
      {/* Detail Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            onClick={handleGoBack}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all outline-none hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-3 focus-visible:ring-blue-600/20 active:scale-95"
            title="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="truncate text-sm font-semibold" title={emailDetail.subject}>
            {emailDetail.subject}
          </span>
        </div>

        <div className="ml-2 flex shrink-0 gap-1">
          <button
            onClick={handleToggleDetailRead}
            disabled={detailMarkReadLoading}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all outline-none hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-3 focus-visible:ring-blue-600/20 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            title={isUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"}
          >
            {detailMarkReadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isUnread ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
          </button>
          <button
            onClick={handleToggleDetailFlag}
            disabled={detailFlagLoading}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all outline-none hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-3 focus-visible:ring-blue-600/20 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            title={isFlagged ? "Bỏ gắn cờ" : "Gắn cờ"}
          >
            {detailFlagLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlagIcon isFlagged={isFlagged} className="size-4" />}
          </button>
          <button
            onClick={() => openZimbraEmail(emailDetail.id)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all outline-none hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-3 focus-visible:ring-blue-600/20 active:scale-95"
            title="Mở Web Mail"
          >
            <SquareArrowOutUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {detailError && <ErrorBanner className="m-2" errorMessage={detailError} setErrorMessage={setDetailError} />}

      {/* Detail Body Scrollable */}
      <div className="flex min-h-0 flex-1 scrollbar-thin flex-col gap-3 overflow-y-auto p-4">
        {/* Sender Container */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white uppercase shadow-inner"
            style={{ backgroundColor: avatarColor }}
          >
            {avatarLetter}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-xs font-semibold">{cleanSender}</span>
              <span className="text-xs whitespace-nowrap text-slate-500">{fullDate}</span>
            </div>
            <div className="truncate text-xs text-slate-500">
              Tới: {emailDetail.to && emailDetail.to.length > 0 ? emailDetail.to.join(", ") : "--"}
              {emailDetail.cc && emailDetail.cc.length > 0 && ` | Cc: ${emailDetail.cc.join(", ")}`}
            </div>
          </div>
        </div>

        {/* Attachments */}
        {emailDetail.attachments && emailDetail.attachments.length > 0 && (
          <div className="flex flex-col gap-1.5 p-0">
            <div className="flex flex-col gap-1.5">
              {emailDetail.attachments.map((att) => {
                const formattedSize = formatFileSize(att.size)
                const progress = downloadProgress[att.part] ?? null
                const error = downloadErrors[att.part] ?? null
                const isDownloading = progress !== null

                return (
                  <div key={att.part} className="flex flex-col gap-1">
                    <div
                      className={cn(
                        "relative flex items-center justify-between gap-1.5 overflow-hidden rounded border p-1.5 px-2.5 text-xs transition-colors",
                        error ? "border-red-200 bg-red-50/50 hover:border-red-300" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
                        <Paperclip className={cn("h-3.5 w-3.5 shrink-0", error ? "text-red-400" : "text-slate-400")} />
                        <button
                          onClick={() => handleDownloadAttachment(emailDetail.id, att.part, att.filename)}
                          disabled={isDownloading}
                          className={cn(
                            "cursor-pointer truncate border-none bg-transparent p-0 font-medium transition-colors outline-none hover:underline focus-visible:ring-3 focus-visible:ring-blue-600/20 disabled:opacity-75",
                            error ? "text-red-700 hover:text-red-800" : "text-slate-700 hover:text-blue-600"
                          )}
                          title={`Tải xuống: ${att.filename}`}
                        >
                          {att.filename}
                        </button>
                        <span className="shrink-0 text-[10px] text-slate-500">({formattedSize})</span>
                      </div>
                      <button
                        onClick={() => handleDownloadAttachment(emailDetail.id, att.part, att.filename)}
                        disabled={isDownloading}
                        className={cn(
                          "flex h-6 min-w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent px-1 transition-all outline-none focus-visible:ring-3 focus-visible:ring-blue-600/20 disabled:opacity-75",
                          error ? "text-red-600 hover:bg-red-100" : "text-blue-600 hover:bg-slate-200 hover:text-orange-500"
                        )}
                        title={progress === 100 ? "Đã tải xong" : isDownloading ? `Đang tải: ${progress}%` : error ? "Thử lại tải file" : "Tải xuống"}
                      >
                        {progress === 100 ? (
                          <Check className="h-4 w-4 text-emerald-600 transition-transform duration-200 scale-100" />
                        ) : isDownloading ? (
                          <span className="text-xs font-semibold text-blue-600">{progress}%</span>
                        ) : error ? (
                          <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* Progress bar line */}
                      {isDownloading && (
                        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-slate-200">
                          <div className="h-full bg-blue-600 transition-all duration-150 ease-out" style={{ width: `${progress}%` }} />
                        </div>
                      )}
                    </div>

                    {/* Per-file Error message */}
                    {error && (
                      <div className="flex items-center justify-between gap-1.5 rounded-md bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                          <span className="truncate" title={error}>
                            Tải thất bại: {error}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDownloadAttachment(emailDetail.id, att.part, att.filename)}
                          className="shrink-0 cursor-pointer text-[10px] font-semibold text-red-700 underline outline-none hover:text-red-900 focus-visible:ring-3 focus-visible:ring-blue-600/20"
                        >
                          Thử lại
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Email Content Frame */}
        <ShadowContent html={emailDetail.bodyHtml} text={emailDetail.bodyText} />
      </div>
    </div>
  )
}
