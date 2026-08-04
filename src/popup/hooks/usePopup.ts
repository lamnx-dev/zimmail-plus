import { useDebounce } from "@/hooks/useDebounce"
import { getAppState } from "@/storage/settings"
import type { AppState, EmailFilterType, MailMessage } from "@/types"
import {
  Action,
  AppStatus,
  EmailFilter,
  ZimbraMessageFlag,
} from "@/utils/constants"
import { sendActionMessage } from "@/utils/sendActionMessage"
import { useEffect, useRef, useState } from "react"
import { useKeyboardShortcuts } from "./useKeyboardShortcuts"
import { useSearchRefresh } from "./useSearchRefresh"

export const ACTIVE_STATES = {
  LOADING: "LOADING",
  DISCONNECTED: "DISCONNECTED",
  MISSING_SERVER_URL: "MISSING_SERVER_URL",
  LIST: "LIST",
} as const

export type ActiveState = (typeof ACTIVE_STATES)[keyof typeof ACTIVE_STATES]

export function usePopup() {
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

    sendActionMessage({ action: Action.REFRESH })

    const listener = async (
      _changes: unknown,
      areaName: chrome.storage.AreaName
    ) => {
      if (areaName === "local") {
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
    let isMounted = true
    const isSilent = searchRefresh.consumeSilent()

    queueMicrotask(() => {
      if (!isMounted) return
      setErrorMessage(null)
      lastViewedEmailRef.current = null

      if (!isSilent) {
        setSearchLoading(true)
        setFocusedIndex(-1)
      }
    })

    sendActionMessage<MailMessage[]>({
      action: Action.SEARCH_EMAILS,
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

  // Timer ẩn displayedEmailId sau hiệu ứng slide animation khi đóng trang Detail
  useEffect(() => {
    if (!selectedEmailId) {
      const timer = setTimeout(() => {
        setDisplayedEmailId(null)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [selectedEmailId])

  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(null), 2000)
    return () => clearTimeout(timer)
  }, [toastMessage])

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
      action: Action.REFRESH,
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
      action: Action.MARK_AS_READ,
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
    const targetAction = isUnread ? Action.MARK_AS_READ : Action.MARK_AS_UNREAD

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
    const targetAction = isFlagged ? Action.UNFLAG_EMAIL : Action.FLAG_EMAIL

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

    let targetIndex = index

    const previousEmail = lastViewedEmailRef.current
    if (previousEmail && previousEmail.id !== message.id) {
      const prevFlags = previousEmail.flags || ""
      const isPrevUnread = prevFlags.includes(ZimbraMessageFlag.UNREAD)
      const isPrevFlagged = prevFlags.includes(ZimbraMessageFlag.FLAGGED)

      const noLongerMatches =
        (filterType === EmailFilter.UNREAD && !isPrevUnread) ||
        (filterType === EmailFilter.FLAGGED && !isPrevFlagged)

      if (noLongerMatches) {
        setSearchResults((prev) => {
          if (!prev) return prev
          const updated = prev.filter((m) => m.id !== previousEmail.id)
          const newIdx = updated.findIndex((m) => m.id === message.id)
          if (newIdx >= 0) {
            targetIndex = newIdx
            previousFocusedIndexRef.current = newIdx
            setFocusedIndex(newIdx)
          }
          return updated
        })
      }
    }

    setSelectedEmailId(message.id)
    setDisplayedEmailId(message.id)
    lastViewedEmailRef.current = message

    if (index >= 0 && targetIndex === index) {
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

  const toggleDetailReadRef = useRef<(() => void) | null>(null)
  const toggleDetailFlagRef = useRef<(() => void) | null>(null)
  const toggleDetailSummarizeRef = useRef<(() => void) | null>(null)

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
    onToggleDetailSummarizeRef: toggleDetailSummarizeRef,
    onReachedBoundary: handleReachedBoundary,
  })

  return {
    appState,
    errorMessage,
    setErrorMessage,
    toastMessage,
    isSearchOpen,
    searchQuery,
    debouncedSearchQuery,
    filterType,
    setFilterType,
    searchResults,
    focusedIndex,
    setFocusedIndex,
    isHelpOpen,
    setIsHelpOpen,
    selectedEmailId,
    displayedEmailId,
    markAllReadLoading,
    markReadLoading,
    flagLoading,
    isDetailOpen,
    activeState,
    toggleDetailReadRef,
    toggleDetailFlagRef,
    toggleDetailSummarizeRef,
    updateLastViewedEmailFlags,
    handleSearchQueryChange,
    handleRefresh,
    handleMarkAllAsRead,
    handleToggleRead,
    handleToggleFlag,
    openMailDetail,
    handleGoBack,
    handleToggleSearch,
    handleCloseSearch,
    handleFocusFirstEmail,
  }
}
