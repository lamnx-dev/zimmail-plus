import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Search, X } from "lucide-react"
import type { EmailFilterType } from "../../types"
import { EmailFilter } from "../../utils/constants"

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
    <div className="flex flex-col gap-2 border-b px-3.5 py-2">
      {/* Search Input */}
      {isSearchOpen && (
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            id="search-input"
            type="text"
            placeholder="Tìm kiếm email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={onInputFocus}
            onKeyDown={handleInputKeyDown}
            autoFocus
          />
          {searchQuery ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                onClick={() => setSearchQuery("")}
              >
                <X />
                <span className="sr-only">Xóa tìm kiếm</span>
              </InputGroupButton>
            </InputGroupAddon>
          ) : onCloseSearch ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                onClick={onCloseSearch}
                className="text-muted-foreground hover:text-foreground"
              >
                <X />
                <span className="sr-only">Đóng tìm kiếm</span>
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
      )}

      {/* Filter Pills */}
      <div className="flex items-center gap-1.5">
        {FILTER_OPTIONS.map((item) => {
          const active = filterType === item.type
          return (
            <Button
              key={item.type}
              onClick={() => handleFilterChange(item.type)}
              variant={active ? "default" : "outline"}
              size="sm"
              className="rounded-full"
            >
              {item.type === EmailFilter.UNREAD && unreadCount
                ? `${item.label} (${unreadCount})`
                : item.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
