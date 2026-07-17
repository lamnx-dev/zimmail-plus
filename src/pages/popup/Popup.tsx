import { CheckCircle, Lock } from "lucide-react"
import { useEffect, useState } from "react"
import { getAppState } from "../../storage/settings"
import type { AppState, MailMessage, MailMessageDetail } from "../../types"
import { downloadAttachment } from "../../utils/download"
import { openZimbraInbox } from "../../utils/navigation"
import EmailDetail from "./components/EmailDetail"
import EmailList from "./components/EmailList"
import Header from "./components/Header"

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
  const activeState: "connecting" | "disconnected" | "empty" | "list" | "detail" = detailLoading
    ? "connecting"
    : emailDetail
      ? "detail"
      : !appState || appState.connectionStatus === "connecting"
        ? "connecting"
        : appState.connectionStatus === "disconnected"
          ? "disconnected"
          : displayedEmails.length === 0
            ? "empty"
            : "list"

  // Refresh
  const handleRefresh = () => {
    if (refreshLoading) return
    setRefreshLoading(true)
    setLastViewedEmail(null)

    chrome.runtime.sendMessage({ action: "refresh" }, async (response) => {
      setRefreshLoading(false)
      if (response && response.success) {
        const state = await getAppState()
        setAppState(state)
      } else {
        console.error("Đồng bộ thất bại:", response?.error)
      }
    })
  }

  // Mark all read
  const handleMarkAllAsRead = () => {
    if (markAllReadLoading) return
    setMarkAllReadLoading(true)

    chrome.runtime.sendMessage({ action: "markAllAsRead" }, (response) => {
      setMarkAllReadLoading(false)
      if (response && response.success) {
        // Success: Chrome storage updates will trigger render
      } else {
        console.error("Không thể đánh dấu tất cả đã đọc:", response?.error)
      }
    })
  }

  // Mark single as read/unread in list
  const handleToggleRead = (e: React.MouseEvent, id: string, isUnread: boolean) => {
    e.stopPropagation()
    if (markReadLoading[id]) return

    setMarkReadLoading((prev) => ({ ...prev, [id]: true }))
    const targetAction = isUnread ? "markAsRead" : "markAsUnread"

    chrome.runtime.sendMessage({ action: targetAction, messageId: id }, (response) => {
      setMarkReadLoading((prev) => ({ ...prev, [id]: false }))
      if (chrome.runtime.lastError) {
        alert("Thao tác thất bại (Lỗi Chrome Runtime): " + chrome.runtime.lastError.message)
        return
      }
      if (response && response.success) {
        if (lastViewedEmail?.id === id) {
          setLastViewedEmail(null)
        }
      } else {
        alert("Thao tác thất bại: " + (response?.error || "Lỗi không xác định"))
      }
    })
  }

  // Open detail view
  const openMailDetail = (messageId: string) => {
    setLoadingText("Đang tải nội dung thư...")
    setDetailLoading(true)

    chrome.runtime.sendMessage({ action: "getMessageDetail", messageId }, async (response) => {
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
        chrome.runtime.sendMessage({ action: "markAsRead", messageId: detail.id })
      } else {
        console.error("Không thể lấy chi tiết email:", response?.error)
        alert("Không thể tải chi tiết email: " + (response?.error || "Lỗi không xác định"))
        const state = await getAppState()
        setAppState(state)
      }
    })
  }

  // Toggle detail read status
  const handleToggleDetailRead = () => {
    if (!emailDetail || detailMarkReadLoading) return
    setDetailMarkReadLoading(true)

    const targetAction = isDetailEmailRead ? "markAsUnread" : "markAsRead"
    chrome.runtime.sendMessage({ action: targetAction, messageId: emailDetail.id }, (response) => {
      setDetailMarkReadLoading(false)
      if (chrome.runtime.lastError) {
        alert("Thao tác thất bại (Lỗi Chrome Runtime): " + chrome.runtime.lastError.message)
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
        alert("Thao tác thất bại: " + (response?.error || "Lỗi không xác định"))
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
      console.error("Lỗi khi tải file đính kèm:", err)
      alert("Không thể tải file đính kèm: " + (err as Error).message)
    } finally {
      setDownloadLoading((prev) => ({ ...prev, [part]: false }))
    }
  }

  return (
    <div className="flex max-h-[512px] w-3xl flex-col overflow-hidden bg-slate-50 font-sans text-slate-900 select-none">
      {/* Header (hidden in detail view) */}
      {activeState !== "detail" && <Header appState={appState} refreshLoading={refreshLoading} handleRefresh={handleRefresh} />}

      {/* Main Content Area */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50">
        {/* Connecting State */}
        {activeState === "connecting" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white px-6 py-9 text-center">
            <div className="mb-2 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <p className="text-xs font-medium text-slate-500">{loadingText}</p>
          </div>
        )}

        {/* Disconnected State */}
        {activeState === "disconnected" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white px-6 py-9 text-center">
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Mất kết nối</h3>
            <p className="mb-1 max-w-72 text-xs leading-relaxed text-slate-500">Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.</p>
            <button
              onClick={openZimbraInbox}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-blue-600 px-4 py-2.5 font-sans text-xs font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
            >
              Đăng nhập
            </button>
          </div>
        )}

        {/* Empty State */}
        {activeState === "empty" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white px-6 py-9 text-center">
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-700">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Tuyệt vời!</h3>
            <p className="mb-1 max-w-72 text-xs leading-relaxed text-slate-500">Bạn đã đọc hết tất cả các email.</p>
          </div>
        )}

        {/* Unread List State */}
        {activeState === "list" && (
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
        {activeState === "detail" && (
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
