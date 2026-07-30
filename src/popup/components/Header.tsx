import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTheme } from "@/components/theme-provider"
import {
  Keyboard,
  Moon,
  RefreshCw,
  Search,
  Settings,
  SquareArrowOutUpRight,
  Sun,
} from "lucide-react"
import { cn } from "../../lib/utils"
import { Nullish, StatusType } from "../../types"
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

export default function Header({
  emailAddress,
  status,
  isSyncing = false,
  handleRefresh,
  isSearchOpen,
  onToggleSearch,
  onOpenHelp,
}: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  return (
    <header className="z-10 flex shrink-0 items-center justify-between border-b bg-background px-3.5 py-2 shadow-2xs">
      <div className="flex min-w-0 items-center gap-2.5">
        <img
          src="/icon.png"
          alt="Logo"
          className="h-6 w-6 shrink-0 rounded object-contain"
        />
        <div className="flex min-w-0 flex-col">
          <span
            className={cn(
              "max-w-96 truncate text-xs font-semibold transition-colors",
              { "text-destructive": status === AppStatus.DISCONNECTED }
            )}
          >
            {emailAddress || APP_NAME}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isSearchOpen ? "secondary" : "ghost"}
              size="icon-lg"
              onClick={onToggleSearch}
              className={cn("rounded-full", isSearchOpen && "text-primary")}
            >
              <Search />
              <span className="sr-only">Tìm kiếm</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>{isSearchOpen ? "Đóng tìm kiếm" : "Tìm kiếm"}</span>
            {!isSearchOpen && <Kbd>/</Kbd>}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={handleRefresh}
              disabled={isSyncing}
              className="rounded-full"
            >
              <RefreshCw className={isSyncing ? "animate-spin" : ""} />
              <span className="sr-only">Làm mới</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Làm mới</span>
            <Kbd>R</Kbd>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={openZimbraInbox}
              className="rounded-full"
            >
              <SquareArrowOutUpRight />
              <span className="sr-only">Mở Web Mail</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Mở Web Mail</span>
            <Kbd>O</Kbd>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="rounded-full"
            >
              {isDark ? <Sun /> : <Moon />}
              <span className="sr-only">Chuyển chế độ sáng/tối</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>{isDark ? "Chế độ sáng" : "Chế độ tối"}</span>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={onOpenHelp}
              className="rounded-full"
            >
              <Keyboard />
              <span className="sr-only">Bảng phím tắt</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Bảng phím tắt</span>
            <Kbd>?</Kbd>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={() => {
                chrome.runtime.openOptionsPage()
                window.close()
              }}
              className="rounded-full"
            >
              <Settings />
              <span className="sr-only">Cài đặt</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Cài đặt</span>
            <KbdGroup>
              <Kbd>Shift</Kbd>
              <Kbd>S</Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
