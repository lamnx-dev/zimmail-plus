/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react"
import { useDebounce } from "../hooks/useDebounce"
import { getAppState, getSettings } from "../storage/settings"
import type { AppState, EmailFilterType, MailMessage, MessageResult } from "../types"
import { cn } from "../utils/cn"
import { ActionType, ConnectionStatus, EmailFilter } from "../utils/constants"
import DisconnectedView from "./components/DisconnectedView"
import EmailDetail from "./components/EmailDetail"
import EmailList from "./components/EmailList"
import EmptyFilterView from "./components/EmptyFilterView"
import ErrorBanner from "./components/ErrorBanner"
import Header from "./components/Header"
import ListSkeleton from "./components/ListSkeleton"
import MissingServerUrlView from "./components/MissingServerUrlView"
import SearchFilter from "./components/SearchFilter"
import { useSearchRefresh } from "./hooks/useSearchRefresh"

const ACTIVE_STATES = {
  CONNECTING: "CONNECTING",
  DISCONNECTED: "DISCONNECTED",
  MISSING_SERVER_URL: "MISSING_SERVER_URL",
  LIST: "LIST",
} as const

type ActiveState = (typeof ACTIVE_STATES)[keyof typeof ACTIVE_STATES]

export default function Popup() {
  // App state & sync
  const [appState, setAppState] = useState<AppState | null>(null)
  const [serverUrlConfigured, setServerUrlConfigured] = useState<boolean | null>(null)

  // Loading & error
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Email detail view
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)

  // Bulk / Item operation loading states
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [markAllReadLoading, setMarkAllReadLoading] = useState(false)
  const [markReadLoading, setMarkReadLoading] = useState<Record<string, boolean>>({})
  const [flagLoading, setFlagLoading] = useState<Record<string, boolean>>({})

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<EmailFilterType>(EmailFilter.ALL)
  const [searchResults, setSearchResults] = useState<MailMessage[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRefresh = useSearchRefresh()

  const debouncedSearchQuery = useDebounce(searchQuery)

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query)
    setErrorMessage(null)
  }

  const handleFilterChange = (type: EmailFilterType) => {
    setFilterType(type)
    setErrorMessage(null)
  }

  // Theo dõi và đồng bộ trạng thái ứng dụng (AppState và Settings)
  useEffect(() => {
    const updateState = async () => {
      const [state, settings] = await Promise.all([getAppState(), getSettings()])
      setAppState(state)
      setServerUrlConfigured(!!settings.serverUrl)
    }
    updateState()

    const listener = async (_changes: unknown, areaName: chrome.storage.AreaName) => {
      if (areaName === "local" || areaName === "sync") {
        await updateState()
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => {
      chrome.storage.onChanged.removeListener(listener)
    }
  }, [])

  // Lắng nghe thay đổi query/filter để gửi request tìm kiếm qua API Zimbra
  useEffect(() => {
    if (!serverUrlConfigured) return

    let isMounted = true
    const isSilent = searchRefresh.consumeSilent()

    if (!isSilent) {
      setSearchLoading(true)
    }

    chrome.runtime.sendMessage(
      {
        action: ActionType.SEARCH_EMAILS,
        query: debouncedSearchQuery,
        filter: filterType,
      },
      (response: MessageResult<MailMessage[]>) => {
        if (!isMounted) return
        setSearchLoading(false)
        if (response?.success) {
          setSearchResults(response.data)
          setErrorMessage(null)
        } else {
          const errorMsg = response?.error || "Lỗi không xác định"
          setSearchResults(null)
          setErrorMessage("Tìm kiếm thất bại: " + errorMsg)
        }
      }
    )

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, filterType, serverUrlConfigured, searchRefresh.refreshKey, searchRefresh.silentKey])

  let activeState: ActiveState

  if (serverUrlConfigured === null) {
    activeState = ACTIVE_STATES.CONNECTING
  } else if (serverUrlConfigured === false) {
    activeState = ACTIVE_STATES.MISSING_SERVER_URL
  } else if (refreshLoading || searchLoading || !appState || appState.connectionStatus === ConnectionStatus.CONNECTING) {
    activeState = ACTIVE_STATES.CONNECTING
  } else if (appState.connectionStatus === ConnectionStatus.DISCONNECTED) {
    activeState = ACTIVE_STATES.DISCONNECTED
  } else {
    activeState = ACTIVE_STATES.LIST
  }

  const handleRefresh = () => {
    if (refreshLoading) return
    setRefreshLoading(true)

    chrome.runtime.sendMessage({ action: ActionType.REFRESH }, (response: MessageResult) => {
      setRefreshLoading(false)
      if (!response?.success) {
        const errorMsg = response?.error || "Lỗi không xác định"
        setErrorMessage("Đồng bộ thất bại: " + errorMsg)
      }
    })

    searchRefresh.refresh()
  }

  const handleMarkAllAsRead = () => {
    if (markAllReadLoading) return
    setMarkAllReadLoading(true)

    chrome.runtime.sendMessage({ action: ActionType.MARK_ALL_AS_READ }, (response: MessageResult) => {
      setMarkAllReadLoading(false)
      if (response?.success) {
        searchRefresh.silentRefresh()
      } else {
        const errorMsg = response?.error || "Lỗi không xác định"
        setErrorMessage("Đánh dấu tất cả đã đọc thất bại: " + errorMsg)
      }
    })
  }

  const handleToggleRead = (e: React.MouseEvent, id: string, isUnread: boolean) => {
    e.stopPropagation()
    if (markReadLoading[id]) return

    setMarkReadLoading((prev) => ({ ...prev, [id]: true }))
    const targetAction = isUnread ? ActionType.MARK_AS_READ : ActionType.MARK_AS_UNREAD

    chrome.runtime.sendMessage({ action: targetAction, messageId: id }, (response: MessageResult) => {
      setMarkReadLoading((prev) => ({ ...prev, [id]: false }))
      if (response?.success) {
        searchRefresh.silentRefresh()
      } else {
        const errorMsg = response?.error || "Lỗi không xác định"
        setErrorMessage(`${isUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"} thất bại: ${errorMsg}`)
      }
    })
  }

  const handleToggleFlag = (e: React.MouseEvent, id: string, isFlagged: boolean) => {
    e.stopPropagation()
    if (flagLoading[id]) return

    setFlagLoading((prev) => ({ ...prev, [id]: true }))
    const targetAction = isFlagged ? ActionType.UNFLAG_EMAIL : ActionType.FLAG_EMAIL

    chrome.runtime.sendMessage({ action: targetAction, messageId: id }, (response: MessageResult) => {
      setFlagLoading((prev) => ({ ...prev, [id]: false }))
      if (response?.success) {
        searchRefresh.silentRefresh()
      } else {
        const errorMsg = response?.error || "Lỗi không xác định"
        setErrorMessage(`${isFlagged ? "Bỏ gắn cờ" : "Gắn cờ"} thất bại: ${errorMsg}`)
      }
    })
  }

  const handleGoBack = () => {
    setSelectedEmailId(null)
  }

  const openMailDetail = (messageId: string) => {
    setErrorMessage(null)
    setSelectedEmailId(messageId)
  }

  const handleSilentRefresh = useCallback(() => {
    searchRefresh.silentRefresh()
  }, [searchRefresh])

  // Email detail view animation state
  const [displayedEmailId, setDisplayedEmailId] = useState<string | null>(null)
  const isDetailOpen = selectedEmailId !== null

  useEffect(() => {
    if (selectedEmailId) {
      setDisplayedEmailId(selectedEmailId)
    } else {
      const timer = setTimeout(() => {
        setDisplayedEmailId(null)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [selectedEmailId])

  return (
    <div className="flex h-[512px] w-3xl flex-col overflow-hidden font-sans">
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
          {activeState !== ACTIVE_STATES.DISCONNECTED && activeState !== ACTIVE_STATES.MISSING_SERVER_URL && (
            <SearchFilter
              searchQuery={searchQuery}
              setSearchQuery={handleSearchQueryChange}
              filterType={filterType}
              handleFilterChange={handleFilterChange}
              unreadCount={appState?.unreadEmails?.length}
            />
          )}

          {activeState !== ACTIVE_STATES.DISCONNECTED && activeState !== ACTIVE_STATES.MISSING_SERVER_URL && (
            <ErrorBanner className="m-2" errorMessage={errorMessage} setErrorMessage={setErrorMessage} />
          )}

          {/* Main Content Area */}
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Connecting State */}
            {activeState === ACTIVE_STATES.CONNECTING && <ListSkeleton />}

            {/* Missing Server URL State */}
            {activeState === ACTIVE_STATES.MISSING_SERVER_URL && <MissingServerUrlView />}

            {/* Disconnected State */}
            {activeState === ACTIVE_STATES.DISCONNECTED && <DisconnectedView />}

            {/* Unread/Search List State */}
            <div className={cn(activeState === ACTIVE_STATES.LIST ? "flex min-h-0 flex-1 flex-col" : "hidden")}>
              {(() => {
                if (searchLoading) {
                  return <ListSkeleton />
                }

                if (searchResults === null) {
                  return null
                }

                if (searchResults.length === 0) {
                  return <EmptyFilterView searchQuery={debouncedSearchQuery} filterType={filterType} />
                }

                return (
                  <EmailList
                    appState={appState}
                    displayedEmails={searchResults}
                    markReadLoading={markReadLoading}
                    flagLoading={flagLoading}
                    markAllReadLoading={markAllReadLoading}
                    openMailDetail={openMailDetail}
                    handleToggleRead={handleToggleRead}
                    handleToggleFlag={handleToggleFlag}
                    handleMarkAllAsRead={handleMarkAllAsRead}
                  />
                )
              })()}
            </div>
          </main>
        </div>

        {/* Detail Screen */}
        <div
          className={cn(
            "absolute inset-0 flex w-full flex-col transition-transform duration-200 ease-in-out",
            isDetailOpen ? "pointer-events-auto translate-x-0" : "pointer-events-none translate-x-full"
          )}
        >
          <EmailDetail emailId={displayedEmailId} filterType={filterType} handleGoBack={handleGoBack} onSilentRefresh={handleSilentRefresh} />
        </div>
      </div>
    </div>
  )
}
