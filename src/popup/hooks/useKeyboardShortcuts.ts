import { useEffect, useRef } from "react"
import type { EmailFilterType, MailMessage } from "../../types"
import { EmailFilter, ZimbraMessageFlag } from "../../utils/constants"
import { openZimbraEmail, openZimbraInbox } from "../../utils/navigation"

interface UseKeyboardShortcutsOptions {
  isDetailOpen: boolean
  selectedEmailId: string | null
  isSearchOpen: boolean
  searchResults: MailMessage[] | null
  focusedIndex: number
  setFocusedIndex: React.Dispatch<React.SetStateAction<number>>
  openMailDetail: (message: MailMessage, index: number) => void
  handleGoBack: () => void
  handleToggleRead: (id: string, isUnread: boolean) => void
  handleToggleFlag: (id: string, isFlagged: boolean) => void
  handleRefresh: () => void
  handleMarkAllAsRead: () => void
  onToggleSearch: () => void
  isHelpOpen: boolean
  setIsHelpOpen: React.Dispatch<React.SetStateAction<boolean>>
  setFilterType: (filter: EmailFilterType) => void
  onToggleDetailReadRef?: React.RefObject<(() => void) | null>
  onToggleDetailFlagRef?: React.RefObject<(() => void) | null>
  onToggleDetailSummarizeRef?: React.RefObject<(() => void) | null>
  onReachedBoundary?: (direction: "top" | "bottom") => void
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isInputActive =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA"

      if (isInputActive) {
        return
      }

      const {
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
        setIsHelpOpen,
        setFilterType,
        onToggleDetailReadRef,
        onToggleDetailFlagRef,
        onToggleDetailSummarizeRef,
      } = optionsRef.current

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

      if (isDetailOpen && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        if (searchResults && searchResults.length > 0 && focusedIndex >= 0) {
          e.preventDefault()
          if (
            e.key === "ArrowDown" &&
            focusedIndex === searchResults.length - 1
          ) {
            optionsRef.current.onReachedBoundary?.("bottom")
            return
          }
          if (e.key === "ArrowUp" && focusedIndex === 0) {
            optionsRef.current.onReachedBoundary?.("top")
            return
          }
          const nextIndex =
            e.key === "ArrowUp"
              ? Math.max(focusedIndex - 1, 0)
              : Math.min(focusedIndex + 1, searchResults.length - 1)
          if (nextIndex !== focusedIndex) {
            openMailDetail(searchResults[nextIndex], nextIndex)
          }
        }
        return
      }

      if (e.key === "ArrowDown" && searchResults && searchResults.length > 0) {
        e.preventDefault()
        if (focusedIndex === searchResults.length - 1) {
          optionsRef.current.onReachedBoundary?.("bottom")
          return
        }
        setFocusedIndex((prev) =>
          prev < 0 ? 0 : Math.min(prev + 1, searchResults.length - 1)
        )
        return
      }

      if (e.key === "ArrowUp" && searchResults && searchResults.length > 0) {
        e.preventDefault()
        if (focusedIndex === 0 && isSearchOpen) {
          setFocusedIndex(-1)
          const searchInput = document.getElementById(
            "search-input"
          ) as HTMLInputElement | null
          searchInput?.focus()
        } else {
          setFocusedIndex((prev) => (prev < 0 ? 0 : Math.max(prev - 1, 0)))
        }
        return
      }

      // Lazy resolve activeMail only when needed
      const getActiveMail = (): MailMessage | null => {
        const focusedMail =
          searchResults && searchResults.length > 0 && focusedIndex >= 0
            ? searchResults[focusedIndex]
            : null
        return isDetailOpen
          ? searchResults?.find((m) => m.id === selectedEmailId) || focusedMail
          : focusedMail
      }

      const isOpenMailKey = e.key === "Enter" || e.key === "ArrowRight"

      if (isOpenMailKey && !isDetailOpen) {
        if (
          searchResults &&
          focusedIndex >= 0 &&
          focusedIndex < searchResults.length
        ) {
          e.preventDefault()
          openMailDetail(searchResults[focusedIndex], focusedIndex)
          return
        }
      }

      if (key === "m") {
        const mail = getActiveMail()
        if (mail) {
          e.preventDefault()
          if (isDetailOpen && onToggleDetailReadRef?.current) {
            onToggleDetailReadRef.current()
          } else {
            const isUnread = (mail.flags || "").includes(
              ZimbraMessageFlag.UNREAD
            )
            handleToggleRead(mail.id, isUnread)
          }
          return
        }
      }

      if (key === "f") {
        const mail = getActiveMail()
        if (mail) {
          e.preventDefault()
          if (isDetailOpen && onToggleDetailFlagRef?.current) {
            onToggleDetailFlagRef.current()
          } else {
            const isFlagged = (mail.flags || "").includes(
              ZimbraMessageFlag.FLAGGED
            )
            handleToggleFlag(mail.id, isFlagged)
          }
          return
        }
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
          const searchInput = document.getElementById(
            "search-input"
          ) as HTMLInputElement | null
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

      if (e.shiftKey && key === "s") {
        e.preventDefault()
        chrome.runtime.openOptionsPage()
        return
      }

      if (!e.shiftKey && key === "s") {
        if (isDetailOpen && onToggleDetailSummarizeRef?.current) {
          e.preventDefault()
          onToggleDetailSummarizeRef.current()
          return
        }
      }

      if (e.shiftKey && key === "o") {
        const mail = getActiveMail()
        if (mail) {
          e.preventDefault()
          openZimbraEmail(mail.id)
          return
        }
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
  }, [])
}
