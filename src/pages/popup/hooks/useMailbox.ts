import { useEffect, useMemo, useState } from "react"
import { downloadAttachment } from "../../../background/api"
import { useDebounce } from "../../../hooks/useDebounce"
import { getAppState } from "../../../storage/settings"
import type { AppState, EmailFilterType, MailMessage, MailMessageDetail } from "../../../types"
import { ActionType, ConnectionStatus, EmailFilter } from "../../../utils/constants"
import { getErrorMessage } from "../../../utils/error"

export const ACTIVE_STATES = {
  CONNECTING: "connecting",
  DISCONNECTED: "disconnected",
  EMPTY: "empty",
  LIST: "list",
  DETAIL: "detail",
} as const

export type ActiveState = (typeof ACTIVE_STATES)[keyof typeof ACTIVE_STATES]

export function useMailbox() {
  const [appState, setAppState] = useState<AppState | null>(null)
  const [lastViewedEmail, setLastViewedEmail] = useState<MailMessage | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [loadingText, setLoadingText] = useState("Đang đồng bộ dữ liệu...")

  const [emailDetail, setEmailDetail] = useState<MailMessageDetail | null>(null)
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [markAllReadLoading, setMarkAllReadLoading] = useState(false)
  const [detailMarkReadLoading, setDetailMarkReadLoading] = useState(false)
  const [isDetailEmailRead, setIsDetailEmailRead] = useState(true)
  const [markReadLoading, setMarkReadLoading] = useState<Record<string, boolean>>({})
  const [downloadLoading, setDownloadLoading] = useState<Record<string, boolean>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<EmailFilterType>(EmailFilter.ALL)
  const [searchResults, setSearchResults] = useState<MailMessage[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false)

  const debouncedSearchQuery = useDebounce(searchQuery)

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

  // Tự động chuyển hướng tab mặc định sang tab "Chưa đọc" khi mở popup nếu phát hiện có email chưa đọc
  useEffect(() => {
    if (appState && !hasRedirected) {
      if (appState.unreadCount > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFilterType(EmailFilter.UNREAD)
      }
      setHasRedirected(true)
    }
  }, [appState, hasRedirected])

  // Lắng nghe sự thay đổi của từ khóa tìm kiếm và tab bộ lọc để gửi request tìm kiếm qua API của máy chủ Zimbra
  useEffect(() => {
    if (!hasRedirected) return

    if (!debouncedSearchQuery.trim() && filterType === EmailFilter.UNREAD) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults(null)
      return
    }

    let isMounted = true
    setSearchLoading(true)

    chrome.runtime.sendMessage(
      {
        action: ActionType.SEARCH_EMAILS,
        queryText: debouncedSearchQuery,
        filterType,
      },
      (response) => {
        if (!isMounted) return
        setSearchLoading(false)
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
  }, [debouncedSearchQuery, filterType, hasRedirected])

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

  const finalEmails = searchResults !== null ? searchResults : displayedEmails

  let activeState: ActiveState

  if (detailLoading) {
    activeState = ACTIVE_STATES.CONNECTING
  } else if (emailDetail) {
    activeState = ACTIVE_STATES.DETAIL
  } else if (!appState || appState.connectionStatus === ConnectionStatus.CONNECTING) {
    activeState = ACTIVE_STATES.CONNECTING
  } else if (appState.connectionStatus === ConnectionStatus.DISCONNECTED) {
    activeState = ACTIVE_STATES.DISCONNECTED
  } else if (searchResults === null && displayedEmails.length === 0) {
    activeState = ACTIVE_STATES.EMPTY
  } else {
    activeState = ACTIVE_STATES.LIST
  }

  const cleanupSearchResults = (state = appState) => {
    if (!searchResults || !state) return
    const unreadIds = new Set((state.unreadEmails || []).map((m) => m.id))
    setSearchResults((prev) => {
      if (!prev) return null
      return prev.filter((msg) => {
        const isUnread = unreadIds.has(msg.id)
        if (filterType === EmailFilter.READ && isUnread) return false
        if (filterType === EmailFilter.UNREAD && !isUnread) return false
        return true
      })
    })
  }

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
        if (searchResults) {
          if ((filterType === EmailFilter.READ && !isUnread) || (filterType === EmailFilter.UNREAD && isUnread)) {
            setSearchResults((prev) => (prev ? prev.filter((m) => m.id !== id) : null))
          }
        }
      } else {
        setErrorMessage("Thao tác thất bại: " + (response?.error || "Lỗi không xác định"))
      }
    })
  }

  const openMailDetail = (messageId: string) => {
    cleanupSearchResults()
    setLastViewedEmail(null)
    setLoadingText("Đang tải nội dung thư...")
    setDetailLoading(true)

    chrome.runtime.sendMessage({ action: ActionType.GET_MESSAGE_DETAIL, messageId }, async (response) => {
      setLoadingText("Đang đồng bộ dữ liệu...")
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

        chrome.runtime.sendMessage({ action: ActionType.MARK_AS_READ, messageId: detail.id })
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
        setLastViewedEmail({
          id: emailDetail.id,
          subject: emailDetail.subject,
          sender: emailDetail.sender,
          date: emailDetail.date,
          fragment: emailDetail.fragment,
        })
      } else {
        setErrorMessage("Thao tác thất bại: " + (response?.error || "Lỗi không xác định"))
      }
    })
  }

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

  return {
    appState,
    searchResults,
    searchLoading,
    finalEmails,
    activeState,
    errorMessage,
    setErrorMessage,
    loadingText,
    emailDetail,
    setEmailDetail,
    isDetailEmailRead,
    detailMarkReadLoading,
    downloadLoading,
    markReadLoading,
    markAllReadLoading,
    refreshLoading,
    handleRefresh,
    handleMarkAllAsRead,
    handleToggleRead,
    openMailDetail,
    handleToggleDetailRead,
    handleDownloadAttachment,
    searchQuery,
    setSearchQuery,
    filterType,
    handleFilterChange,
    hasRedirected,
  }
}
