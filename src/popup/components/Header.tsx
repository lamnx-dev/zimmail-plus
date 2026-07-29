import { Keyboard, RefreshCw, Search, Settings, SquareArrowOutUpRight } from "lucide-react"
import { Nullish, StatusType } from "../../types"
import { cn } from "../../utils/cn"
import { APP_NAME, AppStatus } from "../../utils/constants"
import { openZimbraInbox } from "../../utils/navigation"

interface HeaderProps {
  emailAddress?: Nullish<string>
  status?: StatusType
  isSyncing?: boolean
  handleRefresh: () => void
  isSearchOpen: boolean
  onToggleSearch: () => void
  onOpenHelp: () => void
}

export default function Header({ emailAddress, status, isSyncing = false, handleRefresh, isSearchOpen, onToggleSearch, onOpenHelp }: HeaderProps) {
  return (
    <header className="z-10 flex shrink-0 items-center justify-between border-b border-slate-200 px-3.5 py-2 shadow-sm">
      <div className="flex min-w-0 items-center gap-2.5">
        <img src="/icon.png" alt="Logo" className="h-6 w-6 shrink-0 rounded object-contain" />
        <div className="flex min-w-0 flex-col">
          <span
            className={cn("max-w-96 truncate text-xs font-semibold transition-colors", {
              "text-red-500": status === AppStatus.DISCONNECTED,
            })}
          >
            {emailAddress || APP_NAME}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          onClick={onToggleSearch}
          className={cn(
            "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all outline-none hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-3 focus-visible:ring-blue-600/20 active:scale-95",
            isSearchOpen && "bg-slate-100 font-semibold text-blue-600"
          )}
          title={isSearchOpen ? "Đóng tìm kiếm" : "Tìm kiếm"}
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          onClick={handleRefresh}
          disabled={isSyncing}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all outline-none hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-3 focus-visible:ring-blue-600/20 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          title="Làm mới"
        >
          <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
        </button>
        <button
          onClick={openZimbraInbox}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all outline-none hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-3 focus-visible:ring-blue-600/20 active:scale-95"
          title="Mở Web Mail"
        >
          <SquareArrowOutUpRight className="h-4 w-4" />
        </button>
        <button
          onClick={onOpenHelp}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all outline-none hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-3 focus-visible:ring-blue-600/20 active:scale-95"
          title="Bảng phím tắt"
        >
          <Keyboard className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            chrome.runtime.openOptionsPage()
            window.close()
          }}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all outline-none hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-3 focus-visible:ring-blue-600/20 active:scale-95"
          title="Cài đặt"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}

