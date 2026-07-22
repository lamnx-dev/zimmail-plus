import { ArrowLeft, Check, Download, Loader2, Mail, MailOpen, Paperclip, SquareArrowOutUpRight } from "lucide-react"
import type { MailMessageDetail } from "../../../types"
import { BASE_URL, ZimbraMessageFlag } from "../../../utils/constants"
import { openZimbraEmail } from "../../../utils/navigation"
import { formatEmailFullDate, getAvatarColor, getAvatarLetter, getCleanSenderName } from "../utils"
import FlagIcon from "./FlagIcon"
import ShadowContent from "./ShadowContent"

interface EmailDetailProps {
  emailDetail: MailMessageDetail | null
  detailMarkReadLoading: boolean
  detailFlagLoading: boolean
  downloadProgress: Record<string, number | null>
  handleGoBack: () => void
  handleToggleDetailRead: () => void
  handleToggleDetailFlag: () => void
  handleDownloadAttachment: (messageId: string, part: string, filename: string) => void
}

export default function EmailDetail({
  emailDetail,
  detailMarkReadLoading,
  detailFlagLoading,
  downloadProgress,
  handleGoBack,
  handleToggleDetailRead,
  handleToggleDetailFlag,
  handleDownloadAttachment,
}: EmailDetailProps) {
  if (!emailDetail) return null

  const avatarColor = getAvatarColor(emailDetail.sender)
  const avatarLetter = getAvatarLetter(emailDetail.sender)
  const cleanSender = getCleanSenderName(emailDetail.sender)
  const fullDate = formatEmailFullDate(emailDetail.date)
  const isUnread = !!emailDetail.flags?.includes(ZimbraMessageFlag.UNREAD)
  const isFlagged = !!emailDetail.flags?.includes(ZimbraMessageFlag.FLAGGED)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      {/* Detail Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            onClick={handleGoBack}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
            title="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="truncate text-sm font-semibold text-slate-900" title={emailDetail.subject}>
            {emailDetail.subject}
          </span>
        </div>

        <div className="ml-2 flex shrink-0 gap-1">
          <button
            onClick={handleToggleDetailRead}
            disabled={detailMarkReadLoading}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:opacity-50"
            title={isUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"}
          >
            {detailMarkReadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isUnread ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
          </button>
          <button
            onClick={handleToggleDetailFlag}
            disabled={detailFlagLoading}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:opacity-50"
            title={isFlagged ? "Bỏ đánh dấu sao" : "Đánh dấu sao"}
          >
            {detailFlagLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlagIcon isFlagged={isFlagged} className="size-4" />}
          </button>
          <button
            onClick={() => openZimbraEmail(emailDetail.id)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
            title={`Mở ${BASE_URL}`}
          >
            <SquareArrowOutUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

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
              <span className="truncate text-xs font-semibold text-slate-900">{cleanSender}</span>
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
            <div className="flex flex-col gap-1">
              {emailDetail.attachments.map((att) => {
                const sizeKb = (att.size / 1024).toFixed(1)
                const progress = downloadProgress[att.part] ?? null
                const isDownloading = progress !== null

                return (
                  <div
                    key={att.part}
                    className="relative flex items-center justify-between gap-1.5 overflow-hidden rounded border border-slate-200 bg-slate-50 p-1.5 px-2.5 text-xs transition-colors hover:border-slate-300 hover:bg-slate-100"
                  >
                    <button
                      onClick={() => handleDownloadAttachment(emailDetail.id, att.part, att.filename)}
                      disabled={isDownloading}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-left disabled:opacity-75"
                      title={`Tải xuống: ${att.filename}`}
                    >
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate font-medium text-slate-700 transition-colors hover:text-blue-600 hover:underline" title={att.filename}>
                        {att.filename}
                      </span>
                      <span className="shrink-0 text-[10px] text-slate-500">({sizeKb} KB)</span>
                    </button>
                    <button
                      onClick={() => handleDownloadAttachment(emailDetail.id, att.part, att.filename)}
                      disabled={isDownloading}
                      className="flex h-6 min-w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent px-1 text-blue-600 transition-all hover:bg-slate-200 hover:text-orange-500 disabled:opacity-75"
                      title={progress === 100 ? "Đã tải xong" : isDownloading ? `Đang tải: ${progress}%` : "Tải xuống"}
                    >
                      {progress === 100 ? (
                        <Check className="animate-in zoom-in-75 h-4 w-4 text-emerald-600" />
                      ) : isDownloading ? (
                        <span className="text-xs font-semibold text-blue-600">{progress}%</span>
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
                )
              })}
            </div>
          </div>
        )}

        {/* Email Content Frame */}
        <div className="rounded-lg border border-slate-100 bg-white p-3">
          <ShadowContent html={emailDetail.bodyHtml} text={emailDetail.bodyText} />
        </div>
      </div>
    </div>
  )
}
