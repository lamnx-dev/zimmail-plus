import { cn } from "@/lib/utils"
import ErrorBanner from "./components/ErrorBanner"
import Header from "./components/Header"
import { PopupDetailContainer } from "./components/PopupDetailContainer"
import { PopupMainContent } from "./components/PopupMainContent"
import { PopupToast } from "./components/PopupToast"
import SearchFilter from "./components/SearchFilter"
import ShortcutHelpModal from "./components/ShortcutHelpModal"
import { ACTIVE_STATES, usePopup } from "./hooks/usePopup"

export default function Popup() {
  const popup = usePopup()

  return (
    <div className="relative flex h-[512px] w-3xl flex-col overflow-hidden bg-background">
      <PopupToast message={popup.toastMessage} />

      <ShortcutHelpModal
        isOpen={popup.isHelpOpen}
        onClose={() => popup.setIsHelpOpen(false)}
      />

      <div className="relative flex flex-1 overflow-hidden">
        {/* List Screen */}
        <div
          className={cn(
            "flex w-full shrink-0 flex-col transition-transform duration-200 ease-in-out will-change-transform",
            popup.isDetailOpen
              ? "pointer-events-none -translate-x-full"
              : "translate-x-0"
          )}
        >
          {/* Header */}
          <Header
            emailAddress={popup.appState?.emailAddress}
            status={popup.appState?.status}
            isSyncing={popup.appState?.isSyncing}
            handleRefresh={popup.handleRefresh}
            isSearchOpen={popup.isSearchOpen}
            onToggleSearch={popup.handleToggleSearch}
            onOpenHelp={() => popup.setIsHelpOpen(true)}
          />

          {/* Search and Filter Area */}
          {(popup.activeState === ACTIVE_STATES.LOADING ||
            popup.activeState === ACTIVE_STATES.LIST) && (
            <>
              <SearchFilter
                searchQuery={popup.searchQuery}
                setSearchQuery={popup.handleSearchQueryChange}
                filterType={popup.filterType}
                handleFilterChange={popup.setFilterType}
                unreadCount={popup.appState?.unreadEmails?.length}
                isSearchOpen={popup.isSearchOpen}
                onCloseSearch={popup.handleCloseSearch}
                onFocusFirstEmail={popup.handleFocusFirstEmail}
                onInputFocus={() => popup.setFocusedIndex(-1)}
              />

              {popup.errorMessage && (
                <div className="p-2">
                  <ErrorBanner
                    errorMessage={popup.errorMessage}
                    setErrorMessage={popup.setErrorMessage}
                  />
                </div>
              )}
            </>
          )}

          {/* Main Content Area */}
          <PopupMainContent
            activeState={popup.activeState}
            searchResults={popup.searchResults}
            debouncedSearchQuery={popup.debouncedSearchQuery}
            filterType={popup.filterType}
            appState={popup.appState}
            markReadLoading={popup.markReadLoading}
            flagLoading={popup.flagLoading}
            markAllReadLoading={popup.markAllReadLoading}
            focusedIndex={popup.focusedIndex}
            openMailDetail={popup.openMailDetail}
            handleToggleRead={popup.handleToggleRead}
            handleToggleFlag={popup.handleToggleFlag}
            handleMarkAllAsRead={popup.handleMarkAllAsRead}
          />
        </div>

        {/* Detail Screen */}
        <PopupDetailContainer
          isDetailOpen={popup.isDetailOpen}
          displayedEmailId={popup.displayedEmailId}
          filterType={popup.filterType}
          handleGoBack={popup.handleGoBack}
          onFlagsChange={popup.updateLastViewedEmailFlags}
          onToggleDetailReadRef={popup.toggleDetailReadRef}
          onToggleDetailFlagRef={popup.toggleDetailFlagRef}
          onToggleDetailSummarizeRef={popup.toggleDetailSummarizeRef}
        />
      </div>
    </div>
  )
}
