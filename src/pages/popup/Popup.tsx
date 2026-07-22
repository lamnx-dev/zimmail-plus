import { CheckCircle, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { downloadAttachment } from "../../background/api"
import { useDebounce } from "../../hooks/useDebounce"
import { getAppState } from "../../storage/settings"
import type { AppState, EmailFilterType, MailMessage, MailMessageDetail } from "../../types"
import { cn } from "../../utils/cn"
import { ActionType, ConnectionStatus, EmailFilter, ZimbraMessageFlag } from "../../utils/constants"
import { getErrorMessage } from "../../utils/error"
import DisconnectedView from "./components/DisconnectedView"
import EmailDetail from "./components/EmailDetail"
import EmailList from "./components/EmailList"
import ErrorBanner from "./components/ErrorBanner"
import FlagIcon from "./components/FlagIcon"
import Header from "./components/Header"
import NoUnreadMailView from "./components/NoUnreadMailView"
import SearchFilter from "./components/SearchFilter"
import { useSearchRefresh } from "./hooks/useSearchRefresh"

const DEFAULT_LOADING_TEXT = "Đang đồng bộ dữ liệu..."

const ACTIVE_STATES = {
  CONNECTING: "connecting",
  DISCONNECTED: "disconnected",
  EMPTY: "empty",
  LIST: "list",
  DETAIL: "detail",
} as const

type ActiveState = (typeof ACTIVE_STATES)[keyof typeof ACTIVE_STATES]

export default function Popup() {
  // App state & sync
  const [appState, setAppState] = useState<AppState | null>(null)
  const [hasRedirected, setHasRedirected] = useState(false)

  // Loading & error
  const [loadingText, setLoadingText] = useState(DEFAULT_LOADING_TEXT)
  const resetLoadingText = () => setLoadingText(DEFAULT_LOADING_TEXT)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Email detail view
  const [emailDetail, setEmailDetail] = useState<MailMessageDetail | null>(null)
  const [detailMarkReadLoading, setDetailMarkReadLoading] = useState(false)
  const [detailFlagLoading, setDetailFlagLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [lastViewedEmail, setLastViewedEmail] = useState<MailMessage | null>(null)

  // Bulk / Item operation loading states
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [markAllReadLoading, setMarkAllReadLoading] = useState(false)
  const [markReadLoading, setMarkReadLoading] = useState<Record<string, boolean>>({})
  const [flagLoading, setFlagLoading] = useState<Record<string, boolean>>({})
  const [downloadLoading, setDownloadLoading] = useState<Record<string, boolean>>({})

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<EmailFilterType>(EmailFilter.ALL)
  const [searchResults, setSearchResults] = useState<MailMessage[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRefresh = useSearchRefresh()

  const debouncedSearchQuery = useDebounce(searchQuery)
  const isUnreadTabWithoutSearch = !debouncedSearchQuery.trim() && filterType === EmailFilter.UNREAD

  const handleFilterChange = (type: EmailFilterType) => {
    setFilterType(type)
    setLastViewedEmail(null)
  }

  // Theo dõi và đồng bộ trạng thái ứng dụng (AppState) từ local storage của extension
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

  // Tự động chuyển sang tab "Chưa đọc" khi mở popup nếu phát hiện có email chưa đọc
  useEffect(() => {
    if (appState && !hasRedirected) {
      if (appState.unreadCount > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFilterType(EmailFilter.UNREAD)
      }
      setHasRedirected(true)
    }
  }, [appState, hasRedirected])

  // Lắng nghe thay đổi query/filter để gửi request tìm kiếm qua API Zimbra
  useEffect(() => {
    if (!hasRedirected) return

    if (isUnreadTabWithoutSearch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults(null)
      return
    }

    let isMounted = true
    const isSilent = searchRefresh.consumeSilent()

    if (!isSilent) {
      setSearchLoading(true)
      setLoadingText(debouncedSearchQuery.trim() ? "Đang tìm kiếm..." : "Đang tải danh sách thư...")
    }

    chrome.runtime.sendMessage(
      {
        action: ActionType.SEARCH_EMAILS,
        queryText: debouncedSearchQuery,
        filterType,
      },
      (response) => {
        if (!isMounted) return
        setSearchLoading(false)
        resetLoadingText()
        if (response && response.success && response.emails) {
          setSearchResults(response.emails)
        } else {
          setSearchResults([])
          setErrorMessage("Tìm kiếm thất bại: " + (response?.error || "Lỗi không xác định"))
        }
      }
    )

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, filterType, isUnreadTabWithoutSearch, searchRefresh.refreshKey, searchRefresh.silentKey, hasRedirected])

  const displayedEmails = useMemo(() => {
    const unreadEmails = appState?.unreadEmails || []
    if (!lastViewedEmail || unreadEmails.some((m) => m.id === lastViewedEmail.id)) {
      return unreadEmails
    }

    const lastViewedTime = new Date(lastViewedEmail.date).getTime()
    const insertIdx = unreadEmails.findIndex((m) => new Date(m.date).getTime() < lastViewedTime)

    const list = [...unreadEmails]
    if (insertIdx === -1) {
      list.push(lastViewedEmail)
    } else {
      list.splice(insertIdx, 0, lastViewedEmail)
    }
    return list
  }, [appState?.unreadEmails, lastViewedEmail])

  const finalEmails = isUnreadTabWithoutSearch ? displayedEmails : (searchResults ?? [])

  let activeState: ActiveState

  if (refreshLoading || detailLoading || searchLoading) {
    activeState = ACTIVE_STATES.CONNECTING
  } else if (!appState || appState.connectionStatus === ConnectionStatus.CONNECTING) {
    activeState = ACTIVE_STATES.CONNECTING
  } else if (appState.connectionStatus === ConnectionStatus.DISCONNECTED) {
    activeState = ACTIVE_STATES.DISCONNECTED
  } else if (searchResults === null && displayedEmails.length === 0) {
    activeState = ACTIVE_STATES.EMPTY
  } else {
    activeState = ACTIVE_STATES.LIST
  }

  const handleRefresh = () => {
    if (refreshLoading) return
    setLastViewedEmail(null)
    setRefreshLoading(true)

    chrome.runtime.sendMessage({ action: ActionType.REFRESH }, (response) => {
      setRefreshLoading(false)
      if (!response || !response.success) {
        setErrorMessage("Đồng bộ thất bại: " + (response?.error || "Lỗi không xác định"))
      }
    })

    if (!isUnreadTabWithoutSearch) {
      searchRefresh.refresh()
    }
  }

  const handleMarkAllAsRead = () => {
    if (markAllReadLoading) return
    setMarkAllReadLoading(true)

    chrome.runtime.sendMessage({ action: ActionType.MARK_ALL_AS_READ }, (response) => {
      setMarkAllReadLoading(false)
      if (response && response.success) {
        if (!isUnreadTabWithoutSearch) searchRefresh.silentRefresh()
      } else {
        setErrorMessage("Đánh dấu tất cả đã đọc thất bại: " + (response?.error || "Lỗi không xác định"))
      }
    })
  }

  const handleToggleRead = (e: React.MouseEvent, id: string, isUnread: boolean) => {
    e.stopPropagation()
    if (markReadLoading[id]) return

    setMarkReadLoading((prev) => ({ ...prev, [id]: true }))
    const targetAction = isUnread ? ActionType.MARK_AS_READ : ActionType.MARK_AS_UNREAD

    chrome.runtime.sendMessage({ action: targetAction, messageId: id }, (response) => {
      setMarkReadLoading((prev) => ({ ...prev, [id]: false }))
      if (response && response.success) {
        if (!isUnreadTabWithoutSearch) searchRefresh.silentRefresh()
      } else {
        setErrorMessage(`${isUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"} thất bại: ${response?.error || "Lỗi không xác định"}`)
      }
    })
  }

  const handleToggleFlag = (e: React.MouseEvent, id: string, isFlagged: boolean) => {
    e.stopPropagation()
    if (flagLoading[id]) return

    setFlagLoading((prev) => ({ ...prev, [id]: true }))
    const targetAction = isFlagged ? ActionType.UNFLAG_EMAIL : ActionType.FLAG_EMAIL

    chrome.runtime.sendMessage({ action: targetAction, messageId: id }, (response) => {
      setFlagLoading((prev) => ({ ...prev, [id]: false }))
      if (response && response.success) {
        if (!isUnreadTabWithoutSearch) searchRefresh.silentRefresh()
      } else {
        setErrorMessage(`${isFlagged ? "Bỏ đánh dấu sao" : "Đánh dấu sao"} thất bại: ${response?.error || "Lỗi không xác định"}`)
      }
    })
  }

  const openMailDetail = (messageId: string) => {
    setLastViewedEmail(null)
    setLoadingText("Đang tải nội dung thư...")
    setDetailLoading(true)

    chrome.runtime.sendMessage({ action: ActionType.GET_MESSAGE_DETAIL, messageId }, async (response) => {
      resetLoadingText()
      setDetailLoading(false)

      if (response && response.success && response.detail) {
        const detail: MailMessageDetail = response.detail
        const isUnread = !!detail.flags?.includes(ZimbraMessageFlag.UNREAD)
        setEmailDetail(detail)

        if (isUnread) {
          chrome.runtime.sendMessage({ action: ActionType.MARK_AS_READ, messageId: detail.id }, (markResp) => {
            if (markResp && markResp.success) {
              const updatedFlags = detail.flags?.replace(ZimbraMessageFlag.UNREAD, "") || ""
              setEmailDetail((prev) => prev && { ...prev, flags: updatedFlags })
              setLastViewedEmail({
                id: detail.id,
                subject: detail.subject,
                sender: detail.sender,
                date: detail.date,
                fragment: detail.fragment,
                flags: updatedFlags,
              })
              searchRefresh.silentRefresh()
            }
          })
        }

        setLastViewedEmail({
          id: detail.id,
          subject: detail.subject,
          sender: detail.sender,
          date: detail.date,
          fragment: detail.fragment,
          flags: detail.flags,
        })
      } else {
        setErrorMessage("Không thể tải chi tiết email: " + (response?.error || "Lỗi không xác định"))
        const state = await getAppState()
        setAppState(state)
      }
    })
  }

  const handleToggleDetailRead = () => {
    if (!emailDetail || detailMarkReadLoading) return
    setDetailMarkReadLoading(true)

    const isUnread = !!emailDetail.flags?.includes(ZimbraMessageFlag.UNREAD)
    const targetAction = isUnread ? ActionType.MARK_AS_READ : ActionType.MARK_AS_UNREAD

    chrome.runtime.sendMessage({ action: targetAction, messageId: emailDetail.id }, (response) => {
      setDetailMarkReadLoading(false)
      if (response && response.success) {
        const updatedFlags = isUnread ? emailDetail.flags?.replace(ZimbraMessageFlag.UNREAD, "") || "" : (emailDetail.flags || "") + ZimbraMessageFlag.UNREAD
        setEmailDetail((prev) => prev && { ...prev, flags: updatedFlags })

        setLastViewedEmail({
          id: emailDetail.id,
          subject: emailDetail.subject,
          sender: emailDetail.sender,
          date: emailDetail.date,
          fragment: emailDetail.fragment,
          flags: updatedFlags,
        })

        if (!isUnread && filterType === EmailFilter.UNREAD) {
          setEmailDetail(null)
        }
      } else {
        setErrorMessage(`${isUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"} thất bại: ${response?.error || "Lỗi không xác định"}`)
      }
    })
  }

  const handleToggleDetailFlag = () => {
    if (!emailDetail || detailFlagLoading) return
    setDetailFlagLoading(true)

    const isFlagged = !!emailDetail.flags?.includes(ZimbraMessageFlag.FLAGGED)
    const targetAction = isFlagged ? ActionType.UNFLAG_EMAIL : ActionType.FLAG_EMAIL

    chrome.runtime.sendMessage({ action: targetAction, messageId: emailDetail.id }, (response) => {
      setDetailFlagLoading(false)
      if (response && response.success) {
        const updatedFlags = isFlagged ? emailDetail.flags?.replace(ZimbraMessageFlag.FLAGGED, "") || "" : (emailDetail.flags || "") + ZimbraMessageFlag.FLAGGED
        setEmailDetail((prev) => prev && { ...prev, flags: updatedFlags })

        setLastViewedEmail({
          id: emailDetail.id,
          subject: emailDetail.subject,
          sender: emailDetail.sender,
          date: emailDetail.date,
          fragment: emailDetail.fragment,
          flags: updatedFlags,
        })
        if (!isUnreadTabWithoutSearch) searchRefresh.silentRefresh()
      } else {
        setErrorMessage(`${isFlagged ? "Bỏ đánh dấu sao" : "Đánh dấu sao"} thất bại: ${response?.error || "Lỗi không xác định"}`)
      }
    })
  }

  // Email detail view animation state
  const [displayedDetail, setDisplayedDetail] = useState<MailMessageDetail | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    if (emailDetail) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayedDetail(emailDetail)
      setIsDetailOpen(true)
    } else {
      setIsDetailOpen(false)
      const timer = setTimeout(() => {
        setDisplayedDetail(null)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [emailDetail])

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
    <div className={cn("flex w-3xl flex-col overflow-hidden bg-slate-50 font-sans text-slate-900", isDetailOpen ? "h-[512px]" : "max-h-[512px]")}>
      <div className="relative flex flex-1 overflow-hidden">
        {/* List Screen */}
        <div
          className={cn(
            "flex w-full shrink-0 flex-col transition-transform duration-200 ease-in-out",
            isDetailOpen ? "pointer-events-none -translate-x-full" : "translate-x-0"
          )}
        >
          {/* Header */}
          <Header appState={appState} refreshLoading={refreshLoading} handleRefresh={handleRefresh} />

          {/* Search and Filter Area */}
          {hasRedirected && (
            <SearchFilter
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterType={filterType}
              handleFilterChange={handleFilterChange}
              unreadCount={appState?.unreadCount}
            />
          )}

          <ErrorBanner errorMessage={errorMessage} setErrorMessage={setErrorMessage} />

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
            {activeState === ACTIVE_STATES.DISCONNECTED && <DisconnectedView />}

            {/* No Unread Mail State */}
            {activeState === ACTIVE_STATES.EMPTY && <NoUnreadMailView />}

            {/* Unread/Search List State */}
            <div className={cn(activeState === ACTIVE_STATES.LIST ? "flex min-h-0 flex-1 flex-col" : "hidden")}>
              {searchResults !== null && searchResults.length === 0 ? (
                debouncedSearchQuery.trim() !== "" ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white px-6 py-9 text-center">
                    <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                      <Search className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700">Không tìm thấy thư phù hợp</h3>
                    <p className="text-xs leading-relaxed text-slate-500">Hãy thử lại bằng từ khóa khác.</p>
                  </div>
                ) : filterType === EmailFilter.READ ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white px-6 py-9 text-center">
                    <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-700">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Không có thư đã đọc</h3>
                    <p className="mb-1 text-xs leading-relaxed text-slate-500">Bạn chưa đọc email nào gần đây.</p>
                  </div>
                ) : filterType === EmailFilter.FLAGGED ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white px-6 py-9 text-center">
                    <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                      <FlagIcon className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Không có thư được đánh dấu sao</h3>
                    <p className="mb-1 text-xs leading-relaxed text-slate-500">Bạn chưa đánh dấu sao email nào.</p>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white px-6 py-9 text-center">
                    <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-700">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Hộp thư trống</h3>
                    <p className="mb-1 text-xs leading-relaxed text-slate-500">Không có email nào trong hộp thư của bạn.</p>
                  </div>
                )
              ) : (
                <EmailList
                  appState={appState}
                  displayedEmails={finalEmails}
                  markReadLoading={markReadLoading}
                  flagLoading={flagLoading}
                  markAllReadLoading={markAllReadLoading}
                  isReadTab={filterType === EmailFilter.READ}
                  openMailDetail={openMailDetail}
                  handleToggleRead={handleToggleRead}
                  handleToggleFlag={handleToggleFlag}
                  handleMarkAllAsRead={handleMarkAllAsRead}
                />
              )}
            </div>
          </main>
        </div>

        {/* Detail Screen */}
        <div
          className={cn(
            "absolute inset-0 flex w-full flex-col bg-white transition-transform duration-200 ease-in-out",
            isDetailOpen ? "pointer-events-auto translate-x-0" : "pointer-events-none translate-x-full"
          )}
        >
          {displayedDetail && (
            <EmailDetail
              emailDetail={displayedDetail}
              detailMarkReadLoading={detailMarkReadLoading}
              detailFlagLoading={detailFlagLoading}
              downloadLoading={downloadLoading}
              handleGoBack={() => setEmailDetail(null)}
              handleToggleDetailRead={handleToggleDetailRead}
              handleToggleDetailFlag={handleToggleDetailFlag}
              handleDownloadAttachment={handleDownloadAttachment}
            />
          )}
        </div>
      </div>
    </div>
  )
}
