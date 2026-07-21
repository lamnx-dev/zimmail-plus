import { RefreshCw, Settings, SquareArrowOutUpRight } from "lucide-react"
import type { AppState } from "../../../types"
import { ConnectionStatus } from "../../../utils/constants"
import { openZimbraInbox } from "../../../utils/navigation"

interface HeaderProps {
  appState: AppState | null
  refreshLoading: boolean
  handleRefresh: () => void
}

export default function Header({ appState, refreshLoading, handleRefresh }: HeaderProps) {
  return (
    <header className="z-10 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3.5 py-2 shadow-sm">
      <div className="flex min-w-0 items-center gap-2.5">
        <img src="/assets/icon.png" alt="Logo" className="h-6 w-6 shrink-0 rounded object-contain" />
        <div className="flex min-w-0 flex-col">
          <span
            className={`max-w-[400px] truncate text-xs font-semibold transition-colors ${
              appState?.connectionStatus === ConnectionStatus.CONNECTED
                ? "text-slate-900"
                : appState?.connectionStatus === ConnectionStatus.CONNECTING
                  ? "text-amber-500"
                  : "text-red-500"
            }`}
          >
            {appState?.connectionStatus === ConnectionStatus.CONNECTED
              ? (appState.emailAddress || "Tài khoản")
              : appState?.connectionStatus === ConnectionStatus.CONNECTING
                ? "Đang đồng bộ..."
                : "Mất kết nối"}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          onClick={handleRefresh}
          disabled={refreshLoading}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:opacity-50"
          title="Đồng bộ thủ công"
        >
          <RefreshCw className={`h-4 w-4 ${refreshLoading ? "animate-spin" : ""}`} />
        </button>
        <button
          onClick={openZimbraInbox}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
          title="Mở hộp thư"
        >
          <SquareArrowOutUpRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            chrome.runtime.openOptionsPage()
            window.close()
          }}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
          title="Cài đặt"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
