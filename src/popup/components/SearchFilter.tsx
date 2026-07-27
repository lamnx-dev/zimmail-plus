import { Search, X } from "lucide-react"
import { Input } from "../../components/ui/Input"
import type { EmailFilterType } from "../../types"
import { cn } from "../../utils/cn"
import { EmailFilter } from "../../utils/constants"

interface SearchFilterProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  filterType: EmailFilterType
  handleFilterChange: (type: EmailFilterType) => void
  unreadCount?: number
}

export default function SearchFilter({ searchQuery, setSearchQuery, filterType, handleFilterChange, unreadCount }: SearchFilterProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-2">
      {/* Search Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 z-10 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          type="text"
          placeholder="Tìm kiếm email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-50 py-1.5 pr-8 pl-9"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 z-10 flex cursor-pointer items-center justify-center border-none bg-transparent p-0 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-1.5">
        {(
          [
            { type: EmailFilter.ALL, label: "Tất cả" },
            { type: EmailFilter.UNREAD, label: "Chưa đọc" },
            { type: EmailFilter.FLAGGED, label: "Đã gắn cờ" },
            { type: EmailFilter.HAS_ATTACHMENT, label: "Có tệp" },
          ] as const
        ).map((item) => {
          const active = filterType === item.type
          return (
            <button
              key={item.type}
              onClick={() => handleFilterChange(item.type)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-all",
                active ? "border-blue-600 bg-blue-50 font-semibold text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              {item.type === EmailFilter.UNREAD && unreadCount ? `${item.label} (${unreadCount})` : item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
