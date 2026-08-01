import type { AppState, EmailFilterType, MailMessage } from "@/types"
import DisconnectedView from "./DisconnectedView"
import EmailList from "./EmailList"
import EmptyFilterView from "./EmptyFilterView"
import ListSkeleton from "./ListSkeleton"
import MissingServerUrlView from "./MissingServerUrlView"
import { ACTIVE_STATES, type ActiveState } from "../hooks/usePopup"

interface PopupMainContentProps {
  activeState: ActiveState
  searchResults: MailMessage[] | null
  debouncedSearchQuery: string
  filterType: EmailFilterType
  appState: AppState | null
  markReadLoading: Record<string, boolean>
  flagLoading: Record<string, boolean>
  markAllReadLoading: boolean
  focusedIndex: number
  openMailDetail: (message: MailMessage, index: number) => void
  handleToggleRead: (id: string, isUnread: boolean) => void
  handleToggleFlag: (id: string, isFlagged: boolean) => void
  handleMarkAllAsRead: () => void
}

export function PopupMainContent({
  activeState,
  searchResults,
  debouncedSearchQuery,
  filterType,
  appState,
  markReadLoading,
  flagLoading,
  markAllReadLoading,
  focusedIndex,
  openMailDetail,
  handleToggleRead,
  handleToggleFlag,
  handleMarkAllAsRead,
}: PopupMainContentProps) {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {activeState === ACTIVE_STATES.LOADING ? (
        <ListSkeleton />
      ) : activeState === ACTIVE_STATES.MISSING_SERVER_URL ? (
        <MissingServerUrlView />
      ) : activeState === ACTIVE_STATES.DISCONNECTED ? (
        <DisconnectedView />
      ) : activeState === ACTIVE_STATES.LIST ? (
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
      ) : null}
    </main>
  )
}
