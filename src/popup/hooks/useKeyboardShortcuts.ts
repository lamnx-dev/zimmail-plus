import { useEffect } from "react"
import type { EmailFilterType, MailMessage } from "../../types"
import { EmailFilter } from "../../utils/constants"
import { openZimbraEmail, openZimbraInbox } from "../../utils/navigation"

interface UseKeyboardShortcutsOptions {
  isDetailOpen: boolean
  selectedEmailId: string | null
  isSearchOpen: boolean
  searchResults: MailMessage[] | null
  focusedIndex: number
  setFocusedIndex: React.Dispatch<React.SetStateAction<number>>
  openMailDetail: (message: MailMessage) => void
  handleGoBack: () => void
  handleToggleRead: (e: React.MouseEvent, id: string, isUnread: boolean) => void
  handleToggleFlag: (e: React.MouseEvent, id: string, isFlagged: boolean) => void
  handleRefresh: () => void
  handleMarkAllAsRead: () => void
  onToggleSearch: () => void
  onCloseSearch: () => void
  isHelpOpen: boolean
  setIsHelpOpen: React.Dispatch<React.SetStateAction<boolean>>
  setFilterType: (filter: EmailFilterType) => void
  onToggleDetailReadRef?: React.MutableRefObject<(() => void) | null>
  onToggleDetailFlagRef?: React.MutableRefObject<(() => void) | null>
}

export function useKeyboardShortcuts({
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
  onToggleSearch,
  onCloseSearch,
  isHelpOpen,
  setIsHelpOpen,
  setFilterType,
  onToggleDetailReadRef,
  onToggleDetailFlagRef,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isInputActive = activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA"

      if (isInputActive) {
        return
      }

      const key = e.key.toLowerCase()

      if (e.key === "?") {
        e.preventDefault()
        setIsHelpOpen((prev) => !prev)
        return
      }

      if (isDetailOpen && e.key === "ArrowLeft") {
        e.preventDefault()
        handleGoBack()
        return
      }

      if (e.key === "ArrowDown" && searchResults && searchResults.length > 0) {
        e.preventDefault()
        setFocusedIndex((prev) => (prev < 0 ? 0 : Math.min(prev + 1, searchResults.length - 1)))
        return
      }

      if (e.key === "ArrowUp" && searchResults && searchResults.length > 0) {
        e.preventDefault()
        setFocusedIndex((prev) => (prev < 0 ? 0 : Math.max(prev - 1, 0)))
        return
      }

      const focusedMail = searchResults && searchResults.length > 0 && focusedIndex >= 0 ? searchResults[focusedIndex] : null
      const activeMail = isDetailOpen ? searchResults?.find((m) => m.id === selectedEmailId) || focusedMail : focusedMail

      const isOpenMailKey = e.key === "Enter" || e.key === "ArrowRight"

      if (isOpenMailKey && !isDetailOpen && activeMail) {
        e.preventDefault()
        openMailDetail(activeMail)
        return
      }

      if (key === "m" && activeMail) {
        e.preventDefault()
        if (isDetailOpen && onToggleDetailReadRef?.current) {
          onToggleDetailReadRef.current()
        } else {
          const isUnread = (activeMail.flags || "").includes("u")
          const dummyEvent = { stopPropagation: () => {} } as React.MouseEvent
          handleToggleRead(dummyEvent, activeMail.id, isUnread)
        }
        return
      }

      if (key === "f" && activeMail) {
        e.preventDefault()
        if (isDetailOpen && onToggleDetailFlagRef?.current) {
          onToggleDetailFlagRef.current()
        } else {
          const isFlagged = (activeMail.flags || "").includes("f")
          const dummyEvent = { stopPropagation: () => {} } as React.MouseEvent
          handleToggleFlag(dummyEvent, activeMail.id, isFlagged)
        }
        return
      }

      if (e.shiftKey && key === "a") {
        e.preventDefault()
        handleMarkAllAsRead()
        return
      }

      if (key === "r") {
        e.preventDefault()
        handleRefresh()
        return
      }

      if (e.key === "/") {
        e.preventDefault()
        if (!isSearchOpen) {
          onToggleSearch()
        } else {
          const searchInput = document.getElementById("search-input") as HTMLInputElement | null
          searchInput?.focus()
        }
        return
      }

      if (e.key === "1") {
        e.preventDefault()
        setFilterType(EmailFilter.ALL)
        return
      }
      if (e.key === "2") {
        e.preventDefault()
        setFilterType(EmailFilter.UNREAD)
        return
      }
      if (e.key === "3") {
        e.preventDefault()
        setFilterType(EmailFilter.FLAGGED)
        return
      }
      if (e.key === "4") {
        e.preventDefault()
        setFilterType(EmailFilter.HAS_ATTACHMENT)
        return
      }

      if (e.shiftKey && key === "o") {
        e.preventDefault()
        if (activeMail) {
          openZimbraEmail(activeMail.id)
        }
        return
      }

      if (key === "o") {
        e.preventDefault()
        openZimbraInbox()
        return
      }
    }

    document.addEventListener("keydown", handleKeyDown, true)
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [
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
    onToggleSearch,
    onCloseSearch,
    isHelpOpen,
    setIsHelpOpen,
    setFilterType,
  ])
}
