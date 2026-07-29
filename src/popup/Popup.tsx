/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react"
import { useDebounce } from "../hooks/useDebounce"
import { cn } from "../lib/utils"
import { getAppState } from "../storage/settings"
import type { AppState, EmailFilterType, MailMessage } from "../types"
import {
  ActionType,
  AppStatus,
  EmailFilter,
  ZimbraMessageFlag,
} from "../utils/constants"
import { sendActionMessage } from "../utils/sendActionMessage"
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
  const [appState, setAppState] = useState<AppState | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<EmailFilterType>(EmailFilter.ALL)
  const [searchResults, setSearchResults] = useState<MailMessage[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const debouncedSearchQuery = useDebounce(searchQuery)
  const searchRefresh = useSearchRefresh()

  const [focusedIndex, setFocusedIndex] = useState(-1)
  const previousFocusedIndexRef = useRef(-1)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
  const [displayedEmailId, setDisplayedEmailId] = useState<string | null>(null)
  const lastViewedEmailRef = useRef<MailMessage | null>(null)

  const [markAllReadLoading, setMarkAllReadLoading] = useState(false)
  const [markReadLoading, setMarkReadLoading] = useState<
    Record<string, boolean>
  >({})
  const [flagLoading, setFlagLoading] = useState<Record<string, boolean>>({})

  const isDetailOpen = selectedEmailId !== null

  const activeState: ActiveState = (() => {
    if (!appState || searchLoading) return ACTIVE_STATES.LOADING
    if (appState.status === AppStatus.MISSING_SERVER_URL)
      return ACTIVE_STATES.MISSING_SERVER_URL
    if (appState.status === AppStatus.DISCONNECTED)
      return ACTIVE_STATES.DISCONNECTED
    return ACTIVE_STATES.LIST
  })()

  // Theo dõi và đồng bộ trạng thái ứng dụng (AppState)
  useEffect(() => {
    let isMounted = true

    const updateState = async () => {
      const state = await getAppState()
      if (isMounted) setAppState(state)
    }
    updateState()

    const listener = async (
      _changes: unknown,
      areaName: chrome.storage.AreaName
    ) => {
      if (areaName === "local" || areaName === "sync") {
        await updateState()
      }
    }

    chrome.storage.onChanged.addListener(listener)
    return () => {
      isMounted = false
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
      setFocusedIndex(-1)
    }

    sendActionMessage<MailMessage[]>({
      action: ActionType.SEARCH_EMAILS,
      payload: {
        query: debouncedSearchQuery,
        filter: filterType,
      },
      onSuccess: (data) => {
        if (!isMounted) return
        setSearchLoading(false)
        setSearchResults(data)
      },
      onError: (err) => {
        if (!isMounted) return
        setSearchLoading(false)
        setSearchResults(null)
        setErrorMessage("Tìm kiếm thất bại: " + err)
      },
    })

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, filterType, searchRefresh.silentKey])

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

  function updateLastViewedEmailFlags(id: string, updatedFlags: string) {
    const current = lastViewedEmailRef.current
    if (!current || current.id !== id) return
    const updated = { ...current, flags: updatedFlags }
    lastViewedEmailRef.current = updated
    setSearchResults((prev) =>
      prev ? prev.map((m) => (m.id === id ? updated : m)) : prev
    )
  }

  function handleSearchQueryChange(query: string) {
    setSearchQuery(query)
    setErrorMessage(null)
    lastViewedEmailRef.current = null
  }

  function handleRefresh() {
    if (appState?.isSyncing) return
    setErrorMessage(null)
    sendActionMessage({
      action: ActionType.REFRESH,
      onError: (err) => setErrorMessage(`Đồng bộ thất bại: ${err}`),
    })
    searchRefresh.silentRefresh()
  }

  function updateLocalEmailFlags(
    id: string,
    updateFn: (flags: string) => string
  ) {
    setSearchResults((prev) => {
      if (!prev) return prev
      return prev.map((msg) => {
        if (msg.id !== id) return msg
        const newFlags = updateFn(msg.flags || "")
        return { ...msg, flags: newFlags }
      })
    })
  }

  function handleMarkAllAsRead() {
    const unreadEmails = appState?.unreadEmails
    if (markAllReadLoading || !unreadEmails?.length) return
    const unreadIds = unreadEmails.map((msg) => msg.id)
    const unreadSet = new Set(unreadIds)
    const messageId = unreadIds.join(",")

    setMarkAllReadLoading(true)

    sendActionMessage({
      action: ActionType.MARK_AS_READ,
      payload: { messageId },
      onSuccess: () => {
        setSearchResults((prev) => {
          if (!prev) return prev
          return prev.map((msg) => {
            if (!unreadSet.has(msg.id)) return msg
            const flags = (msg.flags || "").replace(
              ZimbraMessageFlag.UNREAD,
              ""
            )
            return { ...msg, flags }
          })
        })
        searchRefresh.silentRefresh()
      },
      onError: (err) =>
        setErrorMessage(`Đánh dấu tất cả đã đọc thất bại: ${err}`),
      onSettled: () => setMarkAllReadLoading(false),
    })
  }

  function handleToggleRead(id: string, isUnread: boolean) {
    if (markReadLoading[id]) return

    setMarkReadLoading((prev) => ({ ...prev, [id]: true }))
    const targetAction = isUnread
      ? ActionType.MARK_AS_READ
      : ActionType.MARK_AS_UNREAD

    sendActionMessage({
      action: targetAction,
      payload: { messageId: id },
      onSuccess: () => {
        updateLocalEmailFlags(id, (flags) =>
          isUnread
            ? flags.replace(ZimbraMessageFlag.UNREAD, "")
            : flags + ZimbraMessageFlag.UNREAD
        )
        searchRefresh.silentRefresh()
      },
      onError: (err) =>
        setErrorMessage(
          `${isUnread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"} thất bại: ${err}`
        ),
      onSettled: () =>
        setMarkReadLoading((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        }),
    })
  }

  function handleToggleFlag(id: string, isFlagged: boolean) {
    if (flagLoading[id]) return

    setFlagLoading((prev) => ({ ...prev, [id]: true }))
    const targetAction = isFlagged
      ? ActionType.UNFLAG_EMAIL
      : ActionType.FLAG_EMAIL

    sendActionMessage({
      action: targetAction,
      payload: { messageId: id },
      onSuccess: () => {
        updateLocalEmailFlags(id, (flags) =>
          isFlagged
            ? flags.replace(ZimbraMessageFlag.FLAGGED, "")
            : flags + ZimbraMessageFlag.FLAGGED
        )
        searchRefresh.silentRefresh()
      },
      onError: (err) =>
        setErrorMessage(
          `${isFlagged ? "Bỏ gắn cờ" : "Gắn cờ"} thất bại: ${err}`
        ),
      onSettled: () =>
        setFlagLoading((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        }),
    })
  }

  function openMailDetail(message: MailMessage, index: number) {
    setErrorMessage(null)

    const previousEmail = lastViewedEmailRef.current
    if (previousEmail && previousEmail.id !== message.id) {
      const prevFlags = previousEmail.flags || ""
      const isPrevUnread = prevFlags.includes(ZimbraMessageFlag.UNREAD)
      const isPrevFlagged = prevFlags.includes(ZimbraMessageFlag.FLAGGED)

      const noLongerMatches =
        (filterType === EmailFilter.UNREAD && !isPrevUnread) ||
        (filterType === EmailFilter.FLAGGED && !isPrevFlagged)

      if (noLongerMatches) {
        setSearchResults((prev) =>
          prev ? prev.filter((m) => m.id !== previousEmail.id) : prev
        )
      }
    }

    setSelectedEmailId(message.id)
    lastViewedEmailRef.current = message

    if (index >= 0) {
      previousFocusedIndexRef.current = index
      setFocusedIndex(index)
    }
  }

  function handleGoBack() {
    setSelectedEmailId(null)
  }

  function handleToggleSearch() {
    setIsSearchOpen((prev) => {
      if (prev) handleSearchQueryChange("")
      return !prev
    })
  }

  function handleCloseSearch() {
    setIsSearchOpen(false)
    handleSearchQueryChange("")
  }

  function handleFocusFirstEmail() {
    if (searchResults && searchResults.length > 0) {
      setFocusedIndex(0)
      return true
    }
    return false
  }

  function handleReachedBoundary(direction: "top" | "bottom") {
    const msg =
      direction === "bottom" ? "Đã tới email cuối cùng" : "Đã ở email đầu tiên"
    setToastMessage(msg)
  }

  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(null), 2000)
    return () => clearTimeout(timer)
  }, [toastMessage])

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
    isHelpOpen,
    setIsHelpOpen,
    setFilterType,
    onToggleDetailReadRef: toggleDetailReadRef,
    onToggleDetailFlagRef: toggleDetailFlagRef,
    onReachedBoundary: handleReachedBoundary,
  })

  return (
    <div className="relative flex h-[512px] w-3xl flex-col overflow-hidden font-sans">
      {toastMessage && (
        <div className="pointer-events-none absolute top-14 left-1/2 z-50 -translate-x-1/2 rounded-full bg-blue-700 px-3.5 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-xs transition-all duration-200">
          {toastMessage}
        </div>
      )}
      <ShortcutHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
      <div className="relative flex flex-1 overflow-hidden">
        {/* List Screen */}
        <div
          className={cn(
            "flex w-full shrink-0 flex-col transition-transform duration-200 ease-in-out will-change-transform",
            isDetailOpen
              ? "pointer-events-none -translate-x-full"
              : "translate-x-0"
          )}
        >
          {/* Header */}
          <Header
            emailAddress={appState?.emailAddress}
            status={appState?.status}
            isSyncing={appState?.isSyncing}
            handleRefresh={handleRefresh}
            isSearchOpen={isSearchOpen}
            onToggleSearch={handleToggleSearch}
            onOpenHelp={() => setIsHelpOpen(true)}
          />

          {/* Search and Filter Area */}
          {(activeState === ACTIVE_STATES.LOADING ||
            activeState === ACTIVE_STATES.LIST) && (
            <>
              <SearchFilter
                searchQuery={searchQuery}
                setSearchQuery={handleSearchQueryChange}
                filterType={filterType}
                handleFilterChange={setFilterType}
                unreadCount={appState?.unreadEmails?.length}
                isSearchOpen={isSearchOpen}
                onCloseSearch={handleCloseSearch}
                onFocusFirstEmail={handleFocusFirstEmail}
                onInputFocus={() => setFocusedIndex(-1)}
              />

              <ErrorBanner
                className="m-2"
                errorMessage={errorMessage}
                setErrorMessage={setErrorMessage}
              />
            </>
          )}

          {/* Main Content Area */}
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {activeState === ACTIVE_STATES.LOADING && <ListSkeleton />}
            {activeState === ACTIVE_STATES.MISSING_SERVER_URL && (
              <MissingServerUrlView />
            )}
            {activeState === ACTIVE_STATES.DISCONNECTED && <DisconnectedView />}

            {activeState === ACTIVE_STATES.LIST && (
              <div className="flex min-h-0 flex-1 flex-col">
                {searchResults?.length === 0 ? (
                  <EmptyFilterView
                    searchQuery={debouncedSearchQuery}
                    filterType={filterType}
                  />
                ) : searchResults ? (
                  <EmailList
                    lastSyncTime={appState?.lastSyncTime}
                    unreadEmailsCount={appState?.unreadEmails?.length}
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
            "absolute inset-0 flex w-full flex-col transition-transform duration-200 ease-in-out will-change-transform",
            isDetailOpen
              ? "pointer-events-auto translate-x-0"
              : "pointer-events-none translate-x-full"
          )}
        >
          {displayedEmailId && (
            <EmailDetail
              emailId={displayedEmailId}
              filterType={filterType}
              handleGoBack={handleGoBack}
              onFlagsChange={updateLastViewedEmailFlags}
              onToggleDetailReadRef={toggleDetailReadRef}
              onToggleDetailFlagRef={toggleDetailFlagRef}
            />
          )}
        </div>
      </div>
    </div>
  )
}
