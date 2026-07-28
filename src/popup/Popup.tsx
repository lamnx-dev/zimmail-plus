/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDebounce } from "../hooks/useDebounce"
import { getAppState } from "../storage/settings"
import type { AppState, EmailFilterType, MailMessage, MessageResult } from "../types"
import { cn } from "../utils/cn"
import { ActionType, AppStatus, EmailFilter, ZimbraMessageFlag } from "../utils/constants"
import DisconnectedView from "./components/DisconnectedView"
import EmailDetail from "./components/EmailDetail"
import EmailList from "./components/EmailList"
import EmptyFilterView from "./components/EmptyFilterView"
import ErrorBanner from "./components/ErrorBanner"
import Header from "./components/Header"
import ListSkeleton from "./components/ListSkeleton"
import MissingServerUrlView from "./components/MissingServerUrlView"
import SearchFilter from "./components/SearchFilter"
import ShortcutHelpModal from "./components/ShortcutHelpModal"
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts"
import { useSearchRefresh } from "./hooks/useSearchRefresh"

const ACTIVE_STATES = {
  LOADING: "LOADING",
  DISCONNECTED: "DISCONNECTED",
  MISSING_SERVER_URL: "MISSING_SERVER_URL",
  LIST: "LIST",
} as const

type ActiveState = (typeof ACTIVE_STATES)[keyof typeof ACTIVE_STATES]

export default function Popup() {
  // 1. Core / Global App State
  const [appState, setAppState] = useState<AppState | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 2. Search & Filter State
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<EmailFilterType>(EmailFilter.ALL)
  const [searchResults, setSearchResults] = useState<MailMessage[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const debouncedSearchQuery = useDebounce(searchQuery)
  const searchRefresh = useSearchRefresh()

  // 3. Navigation & Shortcut State
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  // 4. Email Detail View & Navigation State
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
  const [displayedEmailId, setDisplayedEmailId] = useState<string | null>(null)
  const lastViewedEmailRef = useRef<MailMessage | null>(null)

  // 5. Action Loading States
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [markAllReadLoading, setMarkAllReadLoading] = useState(false)
  const [markReadLoading, setMarkReadLoading] = useState<Record<string, boolean>>({})
  const [flagLoading, setFlagLoading] = useState<Record<string, boolean>>({})

  // 5. Derived State
  const isDetailOpen = selectedEmailId !== null

  const activeState: ActiveState = useMemo(() => {
    if (!appState || searchLoading) {
      return ACTIVE_STATES.LOADING
    }
    if (appState.status === AppStatus.MISSING_SERVER_URL) {
      return ACTIVE_STATES.MISSING_SERVER_URL
    }
    if (appState.status === AppStatus.DISCONNECTED) {
      return ACTIVE_STATES.DISCONNECTED
    }
    return ACTIVE_STATES.LIST
  }, [appState, searchLoading])

  // 6. Effects
  // Theo dõi và đồng bộ trạng thái ứng dụng (AppState)
  useEffect(() => {
    const updateState = async () => {
      const state = await getAppState()
      setAppState(state)
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
    setErrorMessage(null)
    lastViewedEmailRef.current = null

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
        } else {
          setSearchResults(null)
          const errorMsg = response?.error || "Lỗi không xác định"
          setErrorMessage("Tìm kiếm thất bại: " + errorMsg)
        }

        setFocusedIndex(-1)
      }
    )

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, filterType, searchRefresh.refreshKey, searchRefresh.silentKey])

  // Hiệu ứng transition slide animation cho trang Detail
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

  // 7. Helper / Internal Handlers
  const updateLastViewedEmailFlags = useCallback((id: string, updatedFlags: string) => {
    const current = lastViewedEmailRef.current
    if (!current || current.id !== id) return
    const updated = { ...current, flags: updatedFlags }
    lastViewedEmailRef.current = updated
    setSearchResults((prev) => (prev ? prev.map((m) => (m.id === id ? updated : m)) : prev))
  }, [])

  // 8. Event Handlers
  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query)
    setErrorMessage(null)
    lastViewedEmailRef.current = null
  }, [])

  const handleRefresh = useCallback(() => {
    if (refreshLoading) return
    setErrorMessage(null)
    setRefreshLoading(true)

    chrome.runtime.sendMessage({ action: ActionType.REFRESH }, (response: MessageResult) => {
      setRefreshLoading(false)

      if (!response?.success) {
        const errorMsg = response?.error || "Lỗi không xác định"
        setErrorMessage("Đồng bộ thất bại: " + errorMsg)
      }
    })

    searchRefresh.silentRefresh()
  }, [refreshLoading, searchRefresh])

  const handleMarkAllAsRead = useCallback(() => {
    if (markAllReadLoading || !appState?.unreadEmails?.length) return
    const messageId = appState.unreadEmails.map((msg) => msg.id).join(",")

    setMarkAllReadLoading(true)

    chrome.runtime.sendMessage({ action: ActionType.MARK_AS_READ, messageId }, (response: MessageResult) => {
      setMarkAllReadLoading(false)
      if (response?.success) {
        searchRefresh.silentRefresh()
      } else {
        const errorMsg = response?.error || "Lỗi không xác định"
        setErrorMessage("Đánh dấu tất cả đã đọc thất bại: " + errorMsg)
      }
    })
  }, [appState, markAllReadLoading, searchRefresh])

  const handleToggleRead = useCallback(
    (e: React.MouseEvent, id: string, isUnread: boolean) => {
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
    },
    [markReadLoading, searchRefresh]
  )

  const handleToggleFlag = useCallback(
    (e: React.MouseEvent, id: string, isFlagged: boolean) => {
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
    },
    [flagLoading, searchRefresh]
  )

  const openMailDetail = useCallback(
    (message: MailMessage) => {
      setErrorMessage(null)

      const previousEmail = lastViewedEmailRef.current
      if (previousEmail && previousEmail.id !== message.id) {
        const prevFlags = previousEmail.flags || ""
        const isPrevUnread = prevFlags.includes(ZimbraMessageFlag.UNREAD)
        const isPrevFlagged = prevFlags.includes(ZimbraMessageFlag.FLAGGED)

        const noLongerMatches = (filterType === EmailFilter.UNREAD && !isPrevUnread) || (filterType === EmailFilter.FLAGGED && !isPrevFlagged)

        if (noLongerMatches) {
          setSearchResults((prev) => (prev ? prev.filter((m) => m.id !== previousEmail.id) : prev))
        }
      }

      setSelectedEmailId(message.id)
      lastViewedEmailRef.current = message

      if (searchResults) {
        const index = searchResults.findIndex((m) => m.id === message.id)
        if (index !== -1) {
          setFocusedIndex(index)
        }
      }
    },
    [filterType, searchResults]
  )

  const handleGoBack = useCallback(() => {
    setSelectedEmailId(null)
  }, [])

  const handleToggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => {
      if (prev) {
        handleSearchQueryChange("")
      }
      return !prev
    })
  }, [handleSearchQueryChange])

  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false)
    handleSearchQueryChange("")
  }, [handleSearchQueryChange])

  const handleDetailFlagsChange = useCallback(
    (id: string, updatedFlags: string) => {
      updateLastViewedEmailFlags(id, updatedFlags)
    },
    [updateLastViewedEmailFlags]
  )

  const toggleDetailReadRef = useRef<(() => void) | null>(null)
  const toggleDetailFlagRef = useRef<(() => void) | null>(null)

  useKeyboardShortcuts({
    isDetailOpen,
    selectedEmailId,
    isSearchOpen,
    searchResults,
    focusedIndex,
    setFocusedIndex,
    openMailDetail,
    handleGoBack,
    handleToggleRead,
    handleToggleFlag,
    handleRefresh,
    handleMarkAllAsRead,
    onToggleSearch: handleToggleSearch,
    onCloseSearch: handleCloseSearch,
    isHelpOpen,
    setIsHelpOpen,
    setFilterType,
    onToggleDetailReadRef: toggleDetailReadRef,
    onToggleDetailFlagRef: toggleDetailFlagRef,
  })

  return (
    <div className="flex h-[512px] w-3xl flex-col overflow-hidden font-sans">
      <ShortcutHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <div className="relative flex flex-1 overflow-hidden">
        {/* List Screen */}
        <div
          className={cn(
            "flex w-full shrink-0 flex-col transition-transform duration-200 ease-in-out",
            isDetailOpen ? "pointer-events-none -translate-x-full" : "translate-x-0"
          )}
        >
          {/* Header */}
          <Header
            appState={appState}
            refreshLoading={refreshLoading}
            handleRefresh={handleRefresh}
            isSearchOpen={isSearchOpen}
            onToggleSearch={handleToggleSearch}
            onOpenHelp={() => setIsHelpOpen(true)}
          />

          {/* Search and Filter Area */}
          {activeState !== ACTIVE_STATES.MISSING_SERVER_URL && activeState !== ACTIVE_STATES.DISCONNECTED && (
            <>
              <SearchFilter
                searchQuery={searchQuery}
                setSearchQuery={handleSearchQueryChange}
                filterType={filterType}
                handleFilterChange={setFilterType}
                unreadCount={appState?.unreadEmails?.length}
                isSearchOpen={isSearchOpen}
                onCloseSearch={handleCloseSearch}
              />

              <ErrorBanner className="m-2" errorMessage={errorMessage} setErrorMessage={setErrorMessage} />
            </>
          )}

          {/* Main Content Area */}
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Loading State */}
            {activeState === ACTIVE_STATES.LOADING && <ListSkeleton />}

            {/* Missing Server URL State */}
            {activeState === ACTIVE_STATES.MISSING_SERVER_URL && <MissingServerUrlView />}

            {/* Disconnected State */}
            {activeState === ACTIVE_STATES.DISCONNECTED && <DisconnectedView />}

            {/* Unread/Search List State */}
            {activeState === ACTIVE_STATES.LIST && (
              <div className="flex min-h-0 flex-1 flex-col">
                {searchLoading ? (
                  <ListSkeleton />
                ) : searchResults?.length === 0 ? (
                  <EmptyFilterView searchQuery={debouncedSearchQuery} filterType={filterType} />
                ) : searchResults ? (
                  <EmailList
                    appState={appState}
                    displayedEmails={searchResults}
                    markReadLoading={markReadLoading}
                    flagLoading={flagLoading}
                    markAllReadLoading={markAllReadLoading}
                    focusedIndex={focusedIndex}
                    openMailDetail={openMailDetail}
                    handleToggleRead={handleToggleRead}
                    handleToggleFlag={handleToggleFlag}
                    handleMarkAllAsRead={handleMarkAllAsRead}
                  />
                ) : null}
              </div>
            )}
          </main>
        </div>

        {/* Detail Screen */}
        <div
          className={cn(
            "absolute inset-0 flex w-full flex-col transition-transform duration-200 ease-in-out",
            isDetailOpen ? "pointer-events-auto translate-x-0" : "pointer-events-none translate-x-full"
          )}
        >
          <EmailDetail
            emailId={displayedEmailId}
            filterType={filterType}
            handleGoBack={handleGoBack}
            onFlagsChange={handleDetailFlagsChange}
            onToggleDetailReadRef={toggleDetailReadRef}
            onToggleDetailFlagRef={toggleDetailFlagRef}
          />
        </div>
      </div>
    </div>
  )
}
