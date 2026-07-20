import { AlertTriangle, CheckCircle, ShieldAlert, X } from "lucide-react"
import { useEffect, useState } from "react"
import { downloadAttachment } from "../../background/api"
import { getAppState } from "../../storage/settings"
import type { AppState, MailMessage, MailMessageDetail } from "../../types"
import { ActionType, ConnectionStatus } from "../../utils/constants"
import { getErrorMessage } from "../../utils/error"
import { openZimbraInbox } from "../../utils/navigation"
import EmailDetail from "./components/EmailDetail"
import EmailList from "./components/EmailList"
import Header from "./components/Header"

const ACTIVE_STATES = {
  CONNECTING: "connecting",
  DISCONNECTED: "disconnected",
  EMPTY: "empty",
  LIST: "list",
  DETAIL: "detail",
} as const

type ActiveState = (typeof ACTIVE_STATES)[keyof typeof ACTIVE_STATES]

export default function Popup() {
  const [appState, setAppState] = useState<AppState | null>(null)
  const [lastViewedEmail, setLastViewedEmail] = useState<MailMessage | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [loadingText, setLoadingText] = useState("Đang đồng bộ dữ liệu...")

  // Async task UI states
  const [emailDetail, setEmailDetail] = useState<MailMessageDetail | null>(null)
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [markAllReadLoading, setMarkAllReadLoading] = useState(false)
  const [detailMarkReadLoading, setDetailMarkReadLoading] = useState(false)
  const [isDetailEmailRead, setIsDetailEmailRead] = useState(true)
  const [markReadLoading, setMarkReadLoading] = useState<Record<string, boolean>>({})
  const [downloadLoading, setDownloadLoading] = useState<Record<string, boolean>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Subscribe to storage changes
  useEffect(() => {
    const updateState = async () => {
      const state = await getAppState()
      setAppState(state)
    }
    updateState()

    const listener = async (_changes: unknown, namespace: string) => {
      if (namespace === "local") {
        await updateState()
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => {
      chrome.storage.onChanged.removeListener(listener)
    }
  }, [])

  // Derive displayed emails list
  const unreadEmails = appState?.unreadEmails || []
  const displayedEmails = [...unreadEmails]
  if (lastViewedEmail && !unreadEmails.some((m) => m.id === lastViewedEmail.id)) {
    displayedEmails.push(lastViewedEmail)
  }
  displayedEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Derive activeState during rendering
  let activeState: ActiveState

  if (detailLoading) {
    activeState = ACTIVE_STATES.CONNECTING
  } else if (emailDetail) {
    activeState = ACTIVE_STATES.DETAIL
  } else if (!appState || appState.connectionStatus === ConnectionStatus.CONNECTING) {
    activeState = ACTIVE_STATES.CONNECTING
  } else if (appState.connectionStatus === ConnectionStatus.DISCONNECTED) {
    activeState = ACTIVE_STATES.DISCONNECTED
  } else if (displayedEmails.length === 0) {
    activeState = ACTIVE_STATES.EMPTY
  } else {
    activeState = ACTIVE_STATES.LIST
  }

  // Refresh
  const handleRefresh = () => {
    if (refreshLoading) return
    setRefreshLoading(true)
    setLastViewedEmail(null)

    chrome.runtime.sendMessage({ action: ActionType.REFRESH }, (response) => {
      setRefreshLoading(false)
      if (!response || !response.success) {
        setErrorMessage("Đồng bộ thất bại: " + (response?.error || "Lỗi không xác định"))
      }
    })
  }

  // Mark all read
  const handleMarkAllAsRead = () => {
    if (markAllReadLoading) return
    setMarkAllReadLoading(true)

    chrome.runtime.sendMessage({ action: ActionType.MARK_ALL_AS_READ }, (response) => {
      setMarkAllReadLoading(false)
      if (!response || !response.success) {
        setErrorMessage("Đánh dấu tất cả đã đọc thất bại: " + (response?.error || "Lỗi không xác định"))
      }
    })
  }

  // Mark single as read/unread in list
  const handleToggleRead = (e: React.MouseEvent, id: string, isUnread: boolean) => {
    e.stopPropagation()
    if (markReadLoading[id]) return

    setMarkReadLoading((prev) => ({ ...prev, [id]: true }))
    const targetAction = isUnread ? ActionType.MARK_AS_READ : ActionType.MARK_AS_UNREAD

    chrome.runtime.sendMessage({ action: targetAction, messageId: id }, (response) => {
      setMarkReadLoading((prev) => ({ ...prev, [id]: false }))
      if (chrome.runtime.lastError) {
        setErrorMessage("Thao tác thất bại (Lỗi Chrome Runtime): " + chrome.runtime.lastError.message)
        return
      }
      if (response && response.success) {
        if (lastViewedEmail?.id === id) {
          setLastViewedEmail(null)
        }
      } else {
        setErrorMessage("Thao tác thất bại: " + (response?.error || "Lỗi không xác định"))
      }
    })
  }

  // Open detail view
  const openMailDetail = (messageId: string) => {
    setLoadingText("Đang tải nội dung thư...")
    setDetailLoading(true)

    chrome.runtime.sendMessage({ action: ActionType.GET_MESSAGE_DETAIL, messageId }, async (response) => {
      setLoadingText("Đang đồng bộ dữ liệu...") // restore default
      setDetailLoading(false)

      if (response && response.success && response.detail) {
        const detail: MailMessageDetail = response.detail
        setEmailDetail(detail)
        setIsDetailEmailRead(true)
        setLastViewedEmail({
          id: detail.id,
          subject: detail.subject,
          sender: detail.sender,
          date: detail.date,
          fragment: detail.fragment,
        })

        // Mark as read immediately in background
        chrome.runtime.sendMessage({ action: ActionType.MARK_AS_READ, messageId: detail.id })
      } else {
        setErrorMessage("Không thể tải chi tiết email: " + (response?.error || "Lỗi không xác định"))
        const state = await getAppState()
        setAppState(state)
      }
    })
  }

  // Toggle detail read status
  const handleToggleDetailRead = () => {
    if (!emailDetail || detailMarkReadLoading) return
    setDetailMarkReadLoading(true)

    const targetAction = isDetailEmailRead ? ActionType.MARK_AS_UNREAD : ActionType.MARK_AS_READ
    chrome.runtime.sendMessage({ action: targetAction, messageId: emailDetail.id }, (response) => {
      setDetailMarkReadLoading(false)
      if (chrome.runtime.lastError) {
        setErrorMessage("Thao tác thất bại (Lỗi Chrome Runtime): " + chrome.runtime.lastError.message)
        return
      }
      if (response && response.success) {
        const nextReadState = !isDetailEmailRead
        setIsDetailEmailRead(nextReadState)
        if (nextReadState) {
          setLastViewedEmail({
            id: emailDetail.id,
            subject: emailDetail.subject,
            sender: emailDetail.sender,
            date: emailDetail.date,
            fragment: emailDetail.fragment,
          })
        } else {
          if (lastViewedEmail?.id === emailDetail.id) {
            setLastViewedEmail(null)
          }
        }
      } else {
        setErrorMessage("Thao tác thất bại: " + (response?.error || "Lỗi không xác định"))
      }
    })
  }

  // Download attachment
  const handleDownloadAttachment = async (messageId: string, part: string, filename: string) => {
    if (downloadLoading[part]) return
    setDownloadLoading((prev) => ({ ...prev, [part]: true }))

    try {
      await downloadAttachment(messageId, part, filename)
    } catch (err) {
      setErrorMessage("Tải file thất bại: " + getErrorMessage(err))
    } finally {
      setDownloadLoading((prev) => ({ ...prev, [part]: false }))
    }
  }

  return (
    <div className="flex max-h-[512px] w-3xl flex-col overflow-hidden bg-slate-50 font-sans text-slate-900 select-none">
      {/* Header (hidden in detail view) */}
      {activeState !== ACTIVE_STATES.DETAIL && <Header appState={appState} refreshLoading={refreshLoading} handleRefresh={handleRefresh} />}

      {errorMessage && (
        <div className="mx-2 my-2 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800 transition-all">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          <span className="flex-1 leading-relaxed">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="flex cursor-pointer items-center justify-center border-none bg-transparent p-0 text-red-500 hover:text-red-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50">
        {/* Connecting State */}
        {activeState === ACTIVE_STATES.CONNECTING && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white px-6 py-9 text-center">
            <div className="mb-2 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <p className="text-xs font-medium text-slate-500">{loadingText}</p>
          </div>
        )}

        {/* Disconnected State */}
        {activeState === ACTIVE_STATES.DISCONNECTED && (
          <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-9 text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Mất kết nối</h3>
            <p className="text-xs leading-relaxed text-slate-500">Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.</p>
            <button
              onClick={openZimbraInbox}
              className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-blue-600 px-4 py-2.5 font-sans text-xs font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
            >
              Đăng nhập
            </button>
          </div>
        )}

        {/* Empty State */}
        {activeState === ACTIVE_STATES.EMPTY && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white px-6 py-9 text-center">
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-700">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Tuyệt vời!</h3>
            <p className="mb-1 text-xs leading-relaxed text-slate-500">Bạn đã đọc hết tất cả các email.</p>
          </div>
        )}

        {/* Unread List State */}
        {activeState === ACTIVE_STATES.LIST && (
          <EmailList
            appState={appState}
            displayedEmails={displayedEmails}
            markReadLoading={markReadLoading}
            markAllReadLoading={markAllReadLoading}
            openMailDetail={openMailDetail}
            handleToggleRead={handleToggleRead}
            handleMarkAllAsRead={handleMarkAllAsRead}
          />
        )}

        {/* Email Detail View State */}
        {activeState === ACTIVE_STATES.DETAIL && (
          <EmailDetail
            emailDetail={emailDetail}
            isDetailEmailRead={isDetailEmailRead}
            detailMarkReadLoading={detailMarkReadLoading}
            downloadLoading={downloadLoading}
            handleGoBack={() => setEmailDetail(null)}
            handleToggleDetailRead={handleToggleDetailRead}
            handleDownloadAttachment={handleDownloadAttachment}
          />
        )}
      </main>
    </div>
  )
}
