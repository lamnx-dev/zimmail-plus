import { ArrowLeft, Download, Loader2, Mail, MailOpen, Paperclip, SquareArrowOutUpRight } from "lucide-react"
import type { MailMessageDetail } from "../../../types"
import { BASE_URL, ZimbraMessageFlag } from "../../../utils/constants"
import { openZimbraEmail } from "../../../utils/navigation"
import { formatEmailFullDate, getAvatarColor, getAvatarLetter, getCleanSenderName } from "../utils"
import ShadowContent from "./ShadowContent"

interface EmailDetailProps {
  emailDetail: MailMessageDetail | null
  detailMarkReadLoading: boolean
  downloadLoading: Record<string, boolean>
  handleGoBack: () => void
  handleToggleDetailRead: () => void
  handleDownloadAttachment: (messageId: string, part: string, filename: string) => void
}

export default function EmailDetail({
  emailDetail,
  detailMarkReadLoading,
  downloadLoading,
  handleGoBack,
  handleToggleDetailRead,
  handleDownloadAttachment,
}: EmailDetailProps) {
  if (!emailDetail) return null

  const avatarColor = getAvatarColor(emailDetail.sender)
  const avatarLetter = getAvatarLetter(emailDetail.sender)
  const cleanSender = getCleanSenderName(emailDetail.sender)
  const fullDate = formatEmailFullDate(emailDetail.date)
  const isUnread = !!emailDetail.flags?.includes(ZimbraMessageFlag.UNREAD)

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
                return (
                  <div
                    key={att.part}
                    className="flex items-center justify-between gap-1.5 rounded border border-slate-200 bg-slate-50 p-1 px-2 text-xs transition-colors hover:border-slate-300 hover:bg-slate-100"
                  >
                    <button
                      onClick={() => handleDownloadAttachment(emailDetail.id, att.part, att.filename)}
                      disabled={downloadLoading[att.part]}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-left disabled:opacity-50"
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
                      disabled={downloadLoading[att.part]}
                      className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-1 text-blue-600 transition-all hover:bg-slate-200 hover:text-orange-500 disabled:opacity-50"
                      title="Tải xuống"
                    >
                      {downloadLoading[att.part] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    </button>
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
