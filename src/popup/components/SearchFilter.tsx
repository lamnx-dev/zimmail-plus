import { Search, X } from "lucide-react"
import { Input } from "../../components/ui/Input"
import { cn } from "../../lib/utils"
import type { EmailFilterType } from "../../types"
import { EmailFilter } from "../../utils/constants"

/** Hằng số — không tạo lại mỗi render */
const FILTER_OPTIONS = [
  { type: EmailFilter.ALL, label: "Tất cả" },
  { type: EmailFilter.UNREAD, label: "Chưa đọc" },
  { type: EmailFilter.FLAGGED, label: "Đã gắn cờ" },
  { type: EmailFilter.HAS_ATTACHMENT, label: "Có tệp" },
] as const satisfies ReadonlyArray<{ type: EmailFilterType; label: string }>

interface SearchFilterProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  filterType: EmailFilterType
  handleFilterChange: (type: EmailFilterType) => void
  unreadCount?: number
  isSearchOpen: boolean
  onCloseSearch?: () => void
  onFocusFirstEmail?: () => boolean
  onInputFocus?: () => void
}

export default function SearchFilter({
  searchQuery,
  setSearchQuery,
  filterType,
  handleFilterChange,
  unreadCount,
  isSearchOpen,
  onCloseSearch,
  onFocusFirstEmail,
  onInputFocus,
}: SearchFilterProps) {
  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      const hasEmailToFocus = onFocusFirstEmail?.()
      if (hasEmailToFocus) {
        e.preventDefault()
        e.currentTarget.blur()
      }
    }
  }

  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-2">
      {/* Search Input */}
      {isSearchOpen && (
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 z-10 h-4 w-4 text-slate-400" />
          <Input
            id="search-input"
            type="text"
            placeholder="Tìm kiếm email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={onInputFocus}
            onKeyDown={handleInputKeyDown}
            autoFocus
            className="bg-slate-50 py-1.5 pr-8 pl-9"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 z-10 flex cursor-pointer items-center justify-center border-none bg-transparent p-0 text-slate-400 outline-none hover:text-slate-600 focus-visible:ring-3 focus-visible:ring-blue-600/20"
              title="Xóa tìm kiếm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : onCloseSearch ? (
            <button
              onClick={onCloseSearch}
              className="absolute right-2.5 z-10 flex cursor-pointer items-center justify-center border-none bg-transparent p-0 text-slate-400 outline-none hover:text-slate-600 focus-visible:ring-3 focus-visible:ring-blue-600/20"
              title="Đóng tìm kiếm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      )}

      {/* Filter Pills */}
      <div className="flex items-center gap-1.5">
        {FILTER_OPTIONS.map((item) => {
          const active = filterType === item.type
          return (
            <button
              key={item.type}
              onClick={() => handleFilterChange(item.type)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-all outline-none focus-visible:ring-3 focus-visible:ring-blue-600/20",
                active
                  ? "border-blue-600 bg-blue-50 font-semibold text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              {item.type === EmailFilter.UNREAD && unreadCount
                ? `${item.label} (${unreadCount})`
                : item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
