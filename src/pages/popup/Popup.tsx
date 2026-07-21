import { AlertTriangle, CheckCircle, Search, ShieldAlert, X } from "lucide-react"
import { EmailFilter } from "../../utils/constants"
import { openZimbraInbox } from "../../utils/navigation"
import EmailDetail from "./components/EmailDetail"
import EmailList from "./components/EmailList"
import Header from "./components/Header"
import SearchFilter from "./components/SearchFilter"
import { ACTIVE_STATES, useMailbox } from "./hooks/useMailbox"

export default function Popup() {
  const {
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
  } = useMailbox()

  return (
    <div className="flex max-h-[512px] w-3xl flex-col overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Header (hidden in detail view) */}
      {activeState !== ACTIVE_STATES.DETAIL && <Header appState={appState} refreshLoading={refreshLoading} handleRefresh={handleRefresh} />}

      {/* Search and Filter Area (hidden in detail view) */}
      {activeState !== ACTIVE_STATES.DETAIL && hasRedirected && (
        <SearchFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterType={filterType}
          handleFilterChange={handleFilterChange}
          unreadCount={appState?.unreadCount}
          searchLoading={searchLoading}
        />
      )}

      {errorMessage && (
        <div className="mx-2 my-2 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800 transition-all">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          <span className="flex-1 leading-relaxed">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="flex cursor-pointer items-center justify-center border-none bg-transparent p-0 text-red-500 hover:text-red-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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
        {activeState === ACTIVE_STATES.DISCONNECTED && (
          <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-9 text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Mất kết nối</h3>
            <p className="text-xs leading-relaxed text-slate-500">Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.</p>
            <button
              onClick={openZimbraInbox}
              className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-blue-600 px-4 py-2.5 font-sans text-xs font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
            >
              Đăng nhập
            </button>
          </div>
        )}

        {/* Empty State */}
        {activeState === ACTIVE_STATES.EMPTY && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white px-6 py-9 text-center">
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-700">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Tuyệt vời!</h3>
            <p className="mb-1 text-xs leading-relaxed text-slate-500">Bạn đã đọc hết tất cả các email.</p>
          </div>
        )}

        {/* Unread/Search List State */}
        <div className={activeState === ACTIVE_STATES.LIST ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
          {searchResults !== null && searchResults.length === 0 ? (
            searchQuery.trim() !== "" ? (
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
              markAllReadLoading={markAllReadLoading}
              isReadTab={filterType === EmailFilter.READ}
              openMailDetail={openMailDetail}
              handleToggleRead={handleToggleRead}
              handleMarkAllAsRead={handleMarkAllAsRead}
            />
          )}
        </div>

        {/* Email Detail View State */}
        {activeState === ACTIVE_STATES.DETAIL && (
          <EmailDetail
            emailDetail={emailDetail}
            isDetailEmailRead={isDetailEmailRead}
            detailMarkReadLoading={detailMarkReadLoading}
            downloadLoading={downloadLoading}
            handleGoBack={() => setEmailDetail(null)}
            handleToggleDetailRead={handleToggleDetailRead}
            handleDownloadAttachment={handleDownloadAttachment}
          />
        )}
      </main>
    </div>
  )
}
